/* Fireworks on canvas + small helpers for interactivity.
   Click or press "Burst Now" to create an explosion.
   Auto Fireworks button toggles periodic bursts.
*/

const canvas = document.getElementById('fwCanvas');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;

function resize() {
  DPR = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * DPR);
  canvas.height = Math.floor(canvas.clientHeight * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize, {passive:true});
resize();

const particles = [];
const gravity = 0.06;
const friction = 0.99;

/* Particle constructor */
function Particle(x,y,angle,speed,color,life){
  this.x = x;
  this.y = y;
  this.vx = Math.cos(angle)*speed;
  this.vy = Math.sin(angle)*speed;
  this.color = color;
  this.life = life || 80;
  this.size = Math.random()*2 + 1;
  this.alpha = 1;
}
Particle.prototype.update = function(){
  this.vx *= friction;
  this.vy *= friction;
  this.vy += gravity;
  this.x += this.vx;
  this.y += this.vy;
  this.life--;
  this.alpha = Math.max(0, this.life / 80);
};
Particle.prototype.draw = function(ctx){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = this.alpha;
  ctx.beginPath();
  ctx.fillStyle = this.color;
  ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
};

/* Create an explosion centered at (x,y). colorPalette is array of colors. */
function burst(x,y,options = {}){
  const count = options.count || 80;
  const palette = options.palette || [
    '#ffdd57','#ffd166','#ff8a00','#ff3d81','#7afcff','#9b5cff','#ff6b6b'
  ];
  for(let i=0;i<count;i++){
    const angle = Math.random()*Math.PI*2;
    const speed = (Math.random()*4) + (Math.random()*2);
    const color = palette[Math.floor(Math.random()*palette.length)];
    particles.push(new Particle(x,y,angle,speed,color, Math.floor(60 + Math.random()*40)));
  }
}

/* Create trailing fountain from a point (for launching rockets) */
function launchRocket(){
  const startX = Math.random()*(canvas.width/DPR*0.8) + (canvas.width/DPR*0.1);
  const startY = canvas.height/DPR + 20;
  const peakY = Math.random()*(canvas.height/DPR*0.45) + 40;
  const x = startX;
  const y = startY;
  // simulate a rocket using interval and then burst
  const steps = 45;
  let step = 0;
  const id = setInterval(()=>{
    // draw small trail particle
    particles.push(new Particle(x - Math.random()*2, y - (step*(startY-peakY)/steps), -Math.PI/2 + (Math.random()-0.5)*0.4, Math.random()*0.8+0.6, '#ffffff', 18));
    step++;
    if(step>=steps){
      clearInterval(id);
      burst(x, peakY, {count: 90});
    }
  }, 16);
}

/* animation loop */
function animate(){
  requestAnimationFrame(animate);
  // fade background slightly to create trails
  ctx.fillStyle = "rgba(2,6,23,0.28)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // draw faint stars
  drawStars();

  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.update();
    p.draw(ctx);
    // create mini sparkles as particle dies
    if(p.life<8 && Math.random()<0.15){
      // spawn a few tiny particles
      const c = p.color;
      const count = 2;
      for(let k=0;k<count;k++){
        const angle = Math.random()*Math.PI*2;
        const speed = Math.random()*1.6;
        particles.push(new Particle(p.x, p.y, angle, speed, c, 18));
      }
    }
    if(p.life<=0 || p.alpha<=0.02){
      particles.splice(i,1);
    }
  }
}
let starTimer = 0;
function drawStars(){
  starTimer++;
  if(starTimer % 3 !== 0) return;
  // occasional tiny twinkling points
  ctx.save();
  ctx.globalAlpha = 0.4;
  for(let s=0;s<6;s++){
    const x = Math.random()*canvas.width;
    const y = Math.random()*canvas.height*0.45;
    ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.8})`;
    ctx.fillRect(x,y,1,1);
  }
  ctx.restore();
}

/* Interactivity */
canvas.addEventListener('click', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  burst(x,y, {count: 120});
});

/* Buttons */
const burstBtn = document.getElementById('burstBtn');
burstBtn.addEventListener('click', ()=>{
  // burst near top area
  const x = (canvas.clientWidth/2) * (0.6 + (Math.random()-0.5));
  const y = canvas.clientHeight * (0.25 + Math.random()*0.15);
  burst(x,y, {count: 160});
});

let autoInterval = null;
const autoFireBtn = document.getElementById('autoFireBtn');
autoFireBtn.addEventListener('click', ()=>{
  if(autoInterval){
    clearInterval(autoInterval);
    autoInterval = null;
    autoFireBtn.textContent = 'Auto Fireworks';
  } else {
    autoInterval = setInterval(()=>{
      // launch a mix of rockets and bursts
      if(Math.random() < 0.5) launchRocket();
      else {
        const x = Math.random()*(canvas.clientWidth*0.9)+canvas.clientWidth*0.05;
        const y = canvas.clientHeight*(0.12 + Math.random()*0.25);
        burst(x,y,{count: 100 + Math.floor(Math.random()*80)});
      }
    }, 900 + Math.random()*800);
    autoFireBtn.textContent = 'Stop Auto';
  }
});

/* small periodic launches to keep canvas lively */
setInterval(()=>{
  if(!autoInterval && Math.random()<0.06){
    launchRocket();
  }
}, 800);

/* initial warm bursts */
for(let i=0;i<3;i++){
  setTimeout(()=> launchRocket(), 500 + i*350);
}

/* start animation */
animate();
