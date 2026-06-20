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

  // Manual Text Split Helper for .split-text (Since GSAP SplitText is a club plugin)
  document.querySelectorAll('.split-text').forEach(el => {
    const text = el.innerText;
    el.innerHTML = '';
    text.split(' ').forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';
      
      word.split('').forEach((char) => {
        const charSpan = document.createElement('span');
        charSpan.classList.add('char');
        charSpan.innerText = char;
        wordSpan.appendChild(charSpan);
      });
      
      el.appendChild(wordSpan);
      
      // Add space after word if it's not the last one
      if (wordIndex < text.split(' ').length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    });
  });

  // Hero Intro Animation
  const tl = gsap.timeline();
  tl.fromTo('.fade-up', 
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
  );
  
  tl.fromTo('.hero-showcase',
    { y: 150, opacity: 0, rotateX: 15 },
    { y: 0, opacity: 1, rotateX: 5, duration: 1.4, ease: 'power3.out' },
    '-=0.4'
  );

  // Scroll Reveals for sections
  gsap.utils.toArray('.gs-reveal').forEach(elem => {
    let x = 0;
    if (elem.classList.contains('gs-left')) x = -50;
    else if (elem.classList.contains('gs-right')) x = 50;

    // Standard fade up/side
    if (!elem.querySelector('.split-text')) {
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
    } else {
      // Split text reveal
      const chars = elem.querySelectorAll('.char');
      gsap.fromTo(elem, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, scrollTrigger: { trigger: elem, start: 'top 85%' }});
      gsap.fromTo(chars, 
        { autoAlpha: 0, y: 20, rotateX: -90 },
        {
          duration: 0.8, 
          autoAlpha: 1, 
          y: 0, 
          rotateX: 0,
          stagger: 0.02,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: elem,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  });

  // Parallax on scroll for mock graphics
  gsap.utils.toArray('.feature-hero-card').forEach(card => {
    gsap.to(card, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: card,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });

  // Magnetic Button Hover
  const magnetButtons = document.querySelectorAll('.btn-primary');
  magnetButtons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    });
  });

  // --- Interactive Hero Canvas Simulation (B&W Wireframe) ---
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    
    // Mouse tracking for physics
    const mouse = { x: -1000, y: -1000, radius: 200 };

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
    const particleCount = 120;
    const particles = [];
    
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.baseX = this.x;
        this.baseY = this.y;
        this.radius = Math.random() * 2 + 1;
        this.color = '#ffffff';
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
          // Repulsion
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

      // Draw connections (B&W theme)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            // Alpha based on distance
            const alpha = 1 - (dist / 120);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }
    
    animate();
  }
});
