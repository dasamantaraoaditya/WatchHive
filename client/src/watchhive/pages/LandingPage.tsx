import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import whLogo from '../assets/images/watchhive-logo.png';
import './LandingPage.css';

/* ── TMDb poster URLs for showcasing popular movies ── */
const TMDB_IMG = 'https://image.tmdb.org/t/p';

/* Curated list of iconic/popular movie posters (TMDb poster paths) */
const SHOWCASE_POSTERS = [
    { path: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', title: 'Dune: Part Two' },
    { path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', title: 'Deadpool & Wolverine' },
    { path: '/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg', title: 'Interstellar' },
    { path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', title: 'The Shawshank Redemption' },
    { path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', title: 'The Godfather' },
    { path: '/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg', title: 'The Matrix' },
    { path: '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', title: 'Lord of the Rings' },
    { path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', title: 'Fight Club' },
    { path: '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', title: 'Joker' },
    { path: '/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg', title: 'The Avengers' },
    { path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', title: 'Inception' },
    { path: '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg', title: 'Pulp Fiction' },
    { path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', title: 'Parasite' },
    { path: '/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg', title: 'Oppenheimer' },
    { path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', title: 'Spirited Away' },
    { path: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', title: 'Avatar' },
];

/* Split posters into rows for the dual-direction scroll */
const POSTER_ROW_1 = SHOWCASE_POSTERS.slice(0, 8);
const POSTER_ROW_2 = SHOWCASE_POSTERS.slice(8, 16);

/* ── Feature showcase data (visual-first, minimal text) ── */
const showcaseFeatures = [
    {
        icon: '🔍',
        title: 'Search & Discover',
        desc: 'TMDb-powered instant search',
    },
    {
        icon: '⭐',
        title: 'Rate & Review',
        desc: 'Your personal star ratings',
    },
    {
        icon: '📊',
        title: 'Track Everything',
        desc: 'Movies, series, anime & more',
    },
    {
        icon: '👥',
        title: 'Social Feed',
        desc: 'See what friends are watching',
    },
    {
        icon: '📋',
        title: 'Watchlists',
        desc: 'Organize your queue',
    },
    {
        icon: '🏷️',
        title: 'Tag & Organize',
        desc: 'Custom tags for every watch',
    },
];

/* ── Hook: Intersection Observer for scroll-triggered animations ── */
function useReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    obs.unobserve(el);
                }
            },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);

    return { ref, visible };
}

/* ────────────────────────────────────────────
   LANDING PAGE COMPONENT
   ──────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
    const [scrollY, setScrollY] = useState(0);
    const [navSolid, setNavSolid] = useState(false);

    /* Scroll listener for parallax + nav */
    useEffect(() => {
        const handler = () => {
            setScrollY(window.scrollY);
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    /* Reveal hooks for each section */
    const posterReveal = useReveal(0.1);
    const featureReveal = useReveal(0.1);
    const showcaseReveal = useReveal(0.15);
    const ctaReveal = useReveal(0.2);

    return (
        <div className="lp" id="landing-page">
            {/* ═══════════ NAVIGATION ═══════════ */}
            <nav className={`lp-nav ${navSolid ? 'lp-nav--solid' : ''}`} id="landing-nav">
                <div className="lp-nav__inner">
                    <Link to="/watch-hive" className="lp-nav__brand">
                        <img src={whLogo} alt="WatchHive" className="lp-nav__logo" />
                        <span className="lp-nav__name">WatchHive</span>
                    </Link>
                    <div className="lp-nav__links">
                        <a href="#showcase" className="lp-nav__link">Features</a>
                        <a href="#posters" className="lp-nav__link">Explore</a>
                    </div>
                    <div className="lp-nav__right">
                        <Link to="/watch-hive/login" className="lp-nav__signin" id="landing-signin">
                            Sign In
                        </Link>
                        <Link to="/watch-hive/signup" className="lp-nav__cta" id="landing-signup">
                            Join Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════ HERO — FULL CINEMATIC ═══════════ */}
            <section className="lp-hero" id="hero">
                {/* Cinematic background layers */}
                <div className="lp-hero__cinema-bg">
                    {/* Film grain overlay */}
                    <div className="lp-hero__grain" />
                    {/* Spotlights */}
                    <div
                        className="lp-hero__spotlight lp-hero__spotlight--1"
                        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
                    />
                    <div
                        className="lp-hero__spotlight lp-hero__spotlight--2"
                        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
                    />
                    {/* Vignette */}
                    <div className="lp-hero__vignette" />
                </div>

                <div className="lp-hero__content">
                    <div className="lp-hero__badge">
                        <span className="lp-hero__badge-pulse" />
                        Now Showing
                    </div>

                    <h1 className="lp-hero__title">
                        Your Cinema.<br />
                        <span className="lp-hero__title-accent">Your Story.</span>
                    </h1>

                    <p className="lp-hero__tagline">
                        Track every movie, rate every episode, share with fellow cinephiles.
                    </p>

                    <div className="lp-hero__actions">
                        <Link to="/watch-hive/signup" className="lp-hero__btn lp-hero__btn--primary" id="hero-signup">
                            <span className="lp-hero__btn-glow" />
                            Start Watching
                        </Link>
                        <a href="#posters" className="lp-hero__btn lp-hero__btn--ghost" id="hero-explore">
                            Explore
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 3.5a.5.5 0 01.5.5v7.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L7.5 11.793V4a.5.5 0 01.5-.5z" />
                            </svg>
                        </a>
                    </div>

                    {/* Floating poster cards around hero text */}
                    <div className="lp-hero__floating-posters" aria-hidden="true">
                        <div className="lp-hero__fp lp-hero__fp--1" style={{ transform: `translateY(${scrollY * -0.08}px) rotate(-6deg)` }}>
                            <img src={`${TMDB_IMG}/w185${SHOWCASE_POSTERS[0].path}`} alt="" />
                        </div>
                        <div className="lp-hero__fp lp-hero__fp--2" style={{ transform: `translateY(${scrollY * -0.12}px) rotate(4deg)` }}>
                            <img src={`${TMDB_IMG}/w185${SHOWCASE_POSTERS[2].path}`} alt="" />
                        </div>
                        <div className="lp-hero__fp lp-hero__fp--3" style={{ transform: `translateY(${scrollY * -0.06}px) rotate(-3deg)` }}>
                            <img src={`${TMDB_IMG}/w185${SHOWCASE_POSTERS[4].path}`} alt="" />
                        </div>
                        <div className="lp-hero__fp lp-hero__fp--4" style={{ transform: `translateY(${scrollY * -0.1}px) rotate(7deg)` }}>
                            <img src={`${TMDB_IMG}/w185${SHOWCASE_POSTERS[10].path}`} alt="" />
                        </div>
                        <div className="lp-hero__fp lp-hero__fp--5" style={{ transform: `translateY(${scrollY * -0.07}px) rotate(-5deg)` }}>
                            <img src={`${TMDB_IMG}/w185${SHOWCASE_POSTERS[13].path}`} alt="" />
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="lp-hero__scroll-hint">
                    <div className="lp-hero__scroll-line" />
                </div>
            </section>

            {/* ═══════════ POSTER MARQUEE ═══════════ */}
            <section
                className={`lp-posters ${posterReveal.visible ? 'lp-reveal' : ''}`}
                id="posters"
                ref={posterReveal.ref}
            >
                <div className="lp-posters__label">
                    <span className="lp-posters__label-line" />
                    <span>Trending Now</span>
                    <span className="lp-posters__label-line" />
                </div>

                {/* Row 1 — scrolls left */}
                <div className="lp-posters__track">
                    <div className="lp-posters__marquee lp-posters__marquee--left">
                        {[...POSTER_ROW_1, ...POSTER_ROW_1].map((p, i) => (
                            <div key={i} className="lp-poster-card">
                                <img
                                    src={`${TMDB_IMG}/w342${p.path}`}
                                    alt={p.title}
                                    loading="lazy"
                                />
                                <div className="lp-poster-card__overlay">
                                    <span className="lp-poster-card__title">{p.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 2 — scrolls right */}
                <div className="lp-posters__track">
                    <div className="lp-posters__marquee lp-posters__marquee--right">
                        {[...POSTER_ROW_2, ...POSTER_ROW_2].map((p, i) => (
                            <div key={i} className="lp-poster-card">
                                <img
                                    src={`${TMDB_IMG}/w342${p.path}`}
                                    alt={p.title}
                                    loading="lazy"
                                />
                                <div className="lp-poster-card__overlay">
                                    <span className="lp-poster-card__title">{p.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ FEATURES — VISUAL ICONS ═══════════ */}
            <section
                className={`lp-features ${featureReveal.visible ? 'lp-reveal' : ''}`}
                id="showcase"
                ref={featureReveal.ref}
            >
                <div className="lp-features__grid">
                    {showcaseFeatures.map((f, i) => (
                        <div
                            key={f.title}
                            className="lp-feature"
                            style={{ animationDelay: `${i * 0.08}s` }}
                        >
                            <div className="lp-feature__icon">{f.icon}</div>
                            <h3 className="lp-feature__title">{f.title}</h3>
                            <p className="lp-feature__desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════ APP SHOWCASE — VISUAL SPEAKS ═══════════ */}
            <section
                className={`lp-showcase ${showcaseReveal.visible ? 'lp-reveal' : ''}`}
                ref={showcaseReveal.ref}
            >
                <div className="lp-showcase__inner">
                    {/* Left: Poster Grid preview */}
                    <div className="lp-showcase__visual">
                        <div className="lp-showcase__poster-grid">
                            {SHOWCASE_POSTERS.slice(0, 6).map((p, i) => (
                                <div key={i} className="lp-showcase__mini-poster" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <img src={`${TMDB_IMG}/w185${p.path}`} alt={p.title} loading="lazy" />
                                    <div className="lp-showcase__mini-rating">
                                        ⭐ {(7 + Math.random() * 2.5).toFixed(1)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="lp-showcase__visual-glow" />
                    </div>

                    {/* Right: Brief text */}
                    <div className="lp-showcase__text">
                        <span className="lp-showcase__tag">Your Collection</span>
                        <h2 className="lp-showcase__title">
                            Every Title.<br />
                            <span className="lp-hero__title-accent">Beautifully Tracked.</span>
                        </h2>
                        <p className="lp-showcase__desc">
                            Poster grids, star ratings, watch dates, genres — all at a glance.
                        </p>
                        <Link to="/watch-hive/signup" className="lp-showcase__link">
                            Start Tracking →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════ STATS BAR ═══════════ */}
            <section className="lp-stats">
                <div className="lp-stats__inner">
                    <div className="lp-stats__item">
                        <span className="lp-stats__num">850K+</span>
                        <span className="lp-stats__label">Movies</span>
                    </div>
                    <div className="lp-stats__divider" />
                    <div className="lp-stats__item">
                        <span className="lp-stats__num">180K+</span>
                        <span className="lp-stats__label">TV Series</span>
                    </div>
                    <div className="lp-stats__divider" />
                    <div className="lp-stats__item">
                        <span className="lp-stats__num">25K+</span>
                        <span className="lp-stats__label">Anime</span>
                    </div>
                    <div className="lp-stats__divider" />
                    <div className="lp-stats__item">
                        <span className="lp-stats__num">∞</span>
                        <span className="lp-stats__label">Your Ratings</span>
                    </div>
                </div>
            </section>

            {/* ═══════════ CTA ═══════════ */}
            <section
                className={`lp-cta ${ctaReveal.visible ? 'lp-reveal' : ''}`}
                ref={ctaReveal.ref}
            >
                <div className="lp-cta__inner">
                    <div className="lp-cta__glow" />
                    <img src={whLogo} alt="" className="lp-cta__logo" />
                    <h2 className="lp-cta__title">
                        The Curtain's Up.<br />
                        <span className="lp-hero__title-accent">Take Your Seat.</span>
                    </h2>
                    <Link to="/watch-hive/signup" className="lp-cta__btn" id="cta-signup">
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer className="lp-footer">
                <div className="lp-footer__inner">
                    <div className="lp-footer__brand">
                        <img src={whLogo} alt="WatchHive" className="lp-footer__logo" />
                        <span>WatchHive</span>
                    </div>
                    <p className="lp-footer__copy">
                        © 2026 WatchHive — Track Movies, Anime, K-Drama & Series.
                        Built for cinephiles, by cinephiles.
                    </p>
                    <div className="lp-footer__links">
                        <Link to="/watch-hive/login">Sign In</Link>
                        <Link to="/watch-hive/signup">Sign Up</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
