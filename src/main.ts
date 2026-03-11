// WMR - Web MindMap Recipes
// Main Entry Point

import './style.css';
import { initThreeJS } from './scene';

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c WMR - Web MindMap Recipes %c Loaded ', 
    'background: #00ff9d; color: #05070a; font-weight: bold; padding: 4px; border-radius: 4px 0 0 4px;',
    'background: #161b22; color: #e0e0e0; padding: 4px; border-radius: 0 4px 4px 0;'
  );

  // Initialize background animation
  initThreeJS();

  // Smooth appearance for sections
  const sections = document.querySelectorAll('section');
  const observerOptions = {
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'all 0.6s ease-out';
    observer.observe(section);
  });

  // Adding the visible class logic via JS because it's cleaner than pure CSS for intersection
  window.addEventListener('scroll', () => {
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.8) {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }
    });
  });

  // Header background change on scroll
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });
});
