document.addEventListener('DOMContentLoaded', () => {
  // --- GSAP Scroll Animations ---
  gsap.registerPlugin(ScrollTrigger);

  // Navbar background change on scroll
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Hero Intro Animation
  const tl = gsap.timeline();
  tl.fromTo('.fade-up', 
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
  );
  
  tl.fromTo('.hero-showcase',
    { y: 100, opacity: 0, rotateX: 20 },
    { y: 0, opacity: 1, rotateX: 8, duration: 1.2, ease: 'power3.out' },
    '-=0.4'
  );

  // Scroll Reveals for sections
  gsap.utils.toArray('.gs-reveal').forEach(elem => {
    let x = 0;
    if (elem.classList.contains('gs-left')) x = -50;
    else if (elem.classList.contains('gs-right')) x = 50;

    gsap.fromTo(elem, 
      { autoAlpha: 0, x: x, y: x === 0 ? 50 : 0 },
      {
        duration: 1, 
        autoAlpha: 1, 
        x: 0, 
        y: 0, 
        ease: 'power3.out',
        scrollTrigger: {
          trigger: elem,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });


  // --- Interactive Hero Canvas Simulation ---
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    
    // Mouse tracking for physics
    const mouse = { x: -1000, y: -1000, radius: 150 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    // Create particles (nodes)
    const particleCount = 100;
    const particles = [];
    
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.radius = Math.random() * 2 + 1.5;
        // 80% Cyan, 20% Purple
        this.color = Math.random() > 0.2 ? '#06b6d4' : '#a855f7';
      }

      update() {
        // Natural drift
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Mouse interaction (gravity / repulsion)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          // Slight repulsion
          this.x -= forceDirectionX * force * 2;
          this.y -= forceDirectionY * force * 2;
        }

        this.draw();
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => p.update());

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            // Alpha based on distance
            const alpha = 1 - (dist / 100);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.5})`;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }
    
    animate();
  }
});
