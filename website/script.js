document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Custom Cursor ---
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorOutline = document.querySelector('.cursor-outline');
  
  window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;
    
    // Dot follows instantly
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;
    
    // Outline follows with a slight delay using GSAP
    gsap.to(cursorOutline, {
      x: posX,
      y: posY,
      duration: 0.15,
      ease: 'power2.out'
    });
  });

  // Cursor hover states
  document.querySelectorAll('a, .hover-target, button').forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('hovering');
    });
  });


  // --- 2. Initial Load Animations ---
  setTimeout(() => {
    document.querySelectorAll('.fade-in-up').forEach(el => {
      el.classList.add('visible');
    });
  }, 100);


  // --- 3. Marquee Animation ---
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    gsap.to(marqueeTrack, {
      xPercent: -50,
      ease: "none",
      duration: 20,
      repeat: -1
    });
  }


  // --- 4. GSAP ScrollTrigger Configurations ---
  gsap.registerPlugin(ScrollTrigger);

  // Horizontal Scroll Wrapper
  const hWrapper = document.querySelector('.horizontal-scroll-wrapper');
  const hContainer = document.querySelector('.horizontal-container');
  
  if (hWrapper && hContainer) {
    // Get total scrollable width
    let scrollWidth = hContainer.scrollWidth - window.innerWidth;
    
    gsap.to(hContainer, {
      x: -scrollWidth,
      ease: "none",
      scrollTrigger: {
        trigger: hWrapper,
        pin: true,
        scrub: 1,
        end: () => "+=" + scrollWidth // Pin for the duration of the scroll width
      }
    });
  }

  // Standard vertical reveals
  gsap.utils.toArray('.gs-reveal').forEach(elem => {
    gsap.fromTo(elem, 
      { autoAlpha: 0, y: 50 },
      {
        duration: 1, 
        autoAlpha: 1, 
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


  // --- 5. Interactive Hero Canvas Simulation (B&W Wireframe) ---
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    
    // Mouse tracking for physics
    const mouse = { x: -1000, y: -1000, radius: 250 };

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

    // Create particles
    const particleCount = 150;
    const particles = [];
    
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1;
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

        // Mouse interaction (repulsion)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          this.x -= forceDirectionX * force * 3;
          this.y -= forceDirectionY * force * 3;
        }

        this.draw();
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      // Clear with slight trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
      
      particles.forEach(p => p.update());

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = 1 - (dist / 150);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }
    
    animate();
  }
});
