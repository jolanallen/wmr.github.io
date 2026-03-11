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
  
  const revealSection = (section: HTMLElement) => {
    section.style.opacity = '1';
    section.style.transform = 'translateY(0)';
  };

  // Pre-set initial states
  sections.forEach(section => {
    const el = section as HTMLElement;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
  });

  // Intersection Observer for better performance
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealSection(entry.target as HTMLElement);
        observer.unobserve(entry.target); // Reveal only once
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    observer.observe(section);
  });

  // Fallback / Immediate check for Hero
  setTimeout(() => {
    const hero = document.querySelector('#hero') as HTMLElement;
    if (hero) revealSection(hero);
  }, 100);

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
