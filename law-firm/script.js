/* ── Navbar scroll shadow ─────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
});

/* ── Mobile menu ──────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');

// Create overlay nav for mobile
const overlay = document.createElement('nav');
overlay.className = 'nav-overlay';

const menuItems = [
  { href: '#services',   label: 'Services'   },
  { href: '#about',      label: 'About'      },
  { href: '#team',       label: 'Team'       },
  { href: '#philosophy', label: 'Philosophy' },
  { href: '#spaces',     label: 'Spaces'     },
  { href: '#contact',    label: 'Contact'    },
];

menuItems.forEach(item => {
  const a = document.createElement('a');
  a.href  = item.href;
  a.textContent = item.label;
  a.addEventListener('click', closeMenu);
  overlay.appendChild(a);
});

document.body.appendChild(overlay);

function closeMenu() {
  hamburger.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  overlay.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

/* ── Scroll-in fade animations ────────────────────────────── */
const animTargets = document.querySelectorAll(
  '.service-card, .team-card, .phil-text, .phil-accent, .section-header, .hero-copy, .hero-photo, .contact-form'
);

animTargets.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

animTargets.forEach(el => observer.observe(el));

/* ── Hero elements enter on load ──────────────────────────── */
window.addEventListener('load', () => {
  const heroEls = document.querySelectorAll('.hero-copy, .hero-photo');
  heroEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 200 + i * 180);
  });
});

/* ── Contact form ─────────────────────────────────────────── */
function handleSubmit(e) {
  e.preventDefault();
  const note = document.getElementById('formNote');
  note.textContent = '✓ Thank you! We will be in touch shortly.';
  e.target.reset();
  setTimeout(() => { note.textContent = ''; }, 5000);
}

/* ── Smooth active nav highlight ─────────────────────────── */
const sections = document.querySelectorAll('section[id], main[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => {
          a.style.color = '';
          a.style.setProperty('--active', '0');
        });
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.style.color = 'var(--red)';
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach(s => sectionObserver.observe(s));
