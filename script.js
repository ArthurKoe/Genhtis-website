/* ===== TYPEWRITER HERO ===== */
(function () {
    const el = document.querySelector('.hero__title');
    if (!el) return;

    const fullText = el.textContent.trim();
    el.textContent = '';
    el.style.visibility = 'visible';

    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.appendChild(cursor);

    let i = 0;
    const speed = 45;

    function type() {
        if (i < fullText.length) {
            el.insertBefore(document.createTextNode(fullText.charAt(i)), cursor);
            i++;
            setTimeout(type, speed);
        } else {
            setTimeout(() => { cursor.style.display = 'none'; }, 2000);
        }
    }

    setTimeout(type, 600);
})();

/* ===== NAV SCROLL ===== */
(function () {
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) { nav.classList.add('scrolled'); }
        else { nav.classList.remove('scrolled'); }
    });
})();

/* ===== MOBILE MENU ===== */
(function () {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        menu.classList.toggle('active');
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
})();

/* ===== SMOOTH SCROLL ===== */
(function () {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.pageYOffset - 64;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
})();

/* ===== SCROLL REVEAL ===== */
(function () {
    const items = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => observer.observe(el));
})();


/* ===== CONTACT FORM ===== */
(function () {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const txt = btn.textContent;
        btn.textContent = 'Submitted';
        btn.style.borderColor = '#6b9a6b';
        btn.style.color = '#6b9a6b';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = txt;
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.disabled = false;
            form.reset();
        }, 3000);
    });
})();
