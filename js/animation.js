document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  pages.forEach((page, index) => {
    page.style.transitionDelay = `${index * 50}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.25 });

  pages.forEach(page => observer.observe(page));
});
