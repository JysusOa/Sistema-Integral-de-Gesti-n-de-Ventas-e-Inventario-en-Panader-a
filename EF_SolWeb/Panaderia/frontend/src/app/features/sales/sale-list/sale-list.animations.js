// sale-list.animations.js
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
  // Animación de entrada escalonada para paneles
  gsap.from('.header-actions', { duration: 1, y: 50, opacity: 0, ease: 'power2.out' });
  gsap.from('.table-container', { duration: 1, x: -50, opacity: 0, ease: 'power2.out', delay: 0.5 });

  // Efecto magnético en botón (hover sigue mouse ligeramente)
  const button = document.querySelector('.add-button');
  if (button) {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(button, { duration: 0.3, x: x * 0.1, y: y * 0.1, ease: 'power2.out' });
    });
    button.addEventListener('mouseleave', () => {
      gsap.to(button, { duration: 0.3, x: 0, y: 0, ease: 'power2.out' });
    });
  }

  // Particles flotantes sutiles (opcional, para tech feel)
  const container = document.querySelector('.sale-list-container');
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.background = 'rgba(139, 69, 19, 0.3)';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    container.appendChild(particle);
    gsap.set(particle, { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight });
    gsap.to(particle, {
      duration: Math.random() * 10 + 5,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      repeat: -1,
      ease: 'none'
    });
  }
});
