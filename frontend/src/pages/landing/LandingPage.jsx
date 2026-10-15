import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  Compass,
  LockKeyhole,
  Map,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  UsersRound,
  X
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';
import './LandingPage.css';

const Reveal = ({ children, className = '', delay = 0, reducedMotion }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: reducedMotion ? 0 : 34 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.18 }}
    transition={{ duration: reducedMotion ? 0 : 1.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const previewListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.34, delayChildren: 0.24 } }
};

const reducedPreviewListVariants = {
  hidden: {},
  visible: {}
};

const previewItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.25, ease: [0.22, 1, 0.36, 1] } }
};

const LandingPage = () => {
  const reducedMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const exploreTarget = isAuthenticated ? '/explore' : '#skills-catalog';
  const destination = (path, guestPath = '/register') => isAuthenticated ? path : guestPath;

  useDocumentHead({
    title: 'Orbitus | Learn and teach skills together',
    description: 'Find people to learn with, share skills you know, and grow through peer learning on Orbitus.',
    canonical: 'https://orbitus-skill-swap-platform.vercel.app/'
  });

  const closeMenu = () => setMobileMenuOpen(false);
  const handleExploreClick = (event) => {
    if (isAuthenticated) return;
    handlePreviewClick('skills-catalog')(event);
  };

  const handlePreviewClick = (sectionId) => (event) => {
    if (isAuthenticated) return;
    event.preventDefault();
    closeMenu();
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  return (
    <main className="orbitus-landing">
      <header className="landing-header">
        <div className="landing-nav-wrap">
          <Link to="/" className="landing-brand" aria-label="Orbitus home" onClick={closeMenu}>
            <BrandLogo size={36} className="landing-brand-mark" />
            <span>Orbitus</span>
          </Link>

          <button
            type="button"
            className="landing-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <nav
            id="landing-navigation"
            className={`landing-nav${mobileMenuOpen ? ' is-open' : ''}`}
            aria-label="Main navigation"
          >
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#what-you-can-do" onClick={closeMenu}>Explore Orbitus</a>
            <div className="landing-nav-actions">
              <Link className="landing-sign-in" to={destination('/dashboard', '/login')} onClick={closeMenu}>
                {isAuthenticated ? 'Dashboard' : 'Sign in'}
              </Link>
              <Link className="landing-button landing-button-small" to={destination('/dashboard')} onClick={closeMenu}>
                {isAuthenticated ? 'Open dashboard' : 'Get started'} <ArrowRight size={15} />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-inner">
          <Reveal className="landing-hero-copy" reducedMotion={reducedMotion}>
            <span className="landing-eyebrow"><span /> A community for learning together</span>
            <h1 id="landing-title">Learn something new.<br /><em>Share what you know.</em></h1>
            <p>
              Meet people with different skills, exchange knowledge, and make progress together, one conversation at a time.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-button" to={destination('/dashboard')}>{isAuthenticated ? 'Open dashboard' : 'Create your account'} <ArrowRight size={17} /></Link>
              <Link className="landing-text-link" to={exploreTarget} onClick={handleExploreClick}>Explore skills <ArrowUpRight size={16} /></Link>
            </div>
            <div className="landing-hero-note"><UsersRound size={16} /> Learning is better when it goes both ways.</div>
          </Reveal>

          <motion.div
            className="exchange-illustration"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Share a skill, learn from a peer, and grow together"
          >
            <div className="exchange-stage">
              <span className="exchange-stage-number">01</span>
              <span className="exchange-stage-icon exchange-stage-blue"><BookOpen size={23} /></span>
              <span className="exchange-stage-title">Share what you know</span>
            </div>
            <span className="exchange-stage-connector"><ArrowRight size={19} /></span>
            <div className="exchange-stage exchange-stage-middle">
              <span className="exchange-stage-number">02</span>
              <span className="exchange-stage-icon exchange-stage-coral"><UsersRound size={23} /></span>
              <span className="exchange-stage-title">Meet a learning peer</span>
            </div>
            <span className="exchange-stage-connector"><ArrowRight size={19} /></span>
            <div className="exchange-stage">
              <span className="exchange-stage-number">03</span>
              <span className="exchange-stage-icon exchange-stage-green"><Compass size={23} /></span>
              <span className="exchange-stage-title">Keep growing</span>
            </div>
          </motion.div>
        </div>
        <a className="landing-scroll-cue" href="#how-it-works"><span>Scroll to explore</span><ArrowDown size={15} /></a>
      </section>

      <section className="landing-intro-band" aria-label="About Orbitus">
        <div className="landing-section-shell landing-intro-grid">
          <Reveal reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">A different way to learn</span>
            <h2>Not another course.<br />A connection that helps you grow.</h2>
          </Reveal>
          <Reveal className="landing-intro-copy" delay={0.1} reducedMotion={reducedMotion}>
            <p>Orbitus brings learners and knowledge-sharers together. Find a skill, meet a peer, and build understanding through real conversations and practice.</p>
            <Link className="landing-text-link" to={exploreTarget} onClick={handleExploreClick}>See the skill catalog <ArrowUpRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      <section id="how-it-works" className="landing-section landing-how">
        <div className="landing-section-shell">
          <Reveal className="landing-section-heading" reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">A simple learning loop</span>
            <h2>Start with what you know.</h2>
            <p>Then find the next thing you want to learn.</p>
          </Reveal>
          <div className="landing-steps">
            {[
              { number: '01', title: 'Share your interests', text: 'Choose skills you can share and topics you would like to learn.', icon: BookOpen },
              { number: '02', title: 'Find a connection', text: 'Explore skills and connect with people who want to learn together.', icon: Compass },
              { number: '03', title: 'Learn by doing', text: 'Plan a session, exchange ideas, and keep building your skills.', icon: CalendarDays }
            ].map(({ number, title, text, icon: Icon }, index) => (
              <Reveal key={number} className="landing-step" delay={index * 0.09} reducedMotion={reducedMotion}>
                <div className="landing-step-top"><span>{number}</span><Icon size={20} strokeWidth={1.7} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-device-section" aria-labelledby="landing-device-title">
        <div className="landing-section-shell">
          <Reveal className="landing-section-heading landing-device-heading" reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">Shared knowledge, real progress</span>
            <h2 id="landing-device-title">A new skill can start with one conversation.</h2>
            <p>Here is a small preview of Orbitus. Sign in to explore the full skills catalog.</p>
          </Reveal>

          <div className="landing-device-stage" role="img" aria-label="A browser window preview of the Orbitus skills catalog">
            <motion.div
              className="landing-browser-window"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 38, scale: reducedMotion ? 1 : 0.975 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: reducedMotion ? 0 : 2, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            >
              <div className="landing-browser-toolbar">
                <div className="landing-browser-dots"><i /><i /><i /></div>
                <div className="landing-browser-address"><LockKeyhole size={13} /><span>orbitus-skill-swap-platform.vercel.app/explore</span></div>
                <MoreHorizontal size={18} />
              </div>
              <div className="landing-browser-page">
                <div className="landing-browser-page-header">
                  <div className="landing-browser-brand"><BrandLogo size={25} /><strong>Orbitus</strong></div>
                  <span>Explore skills</span><span>Learn together</span>
                </div>
                <div className="landing-browser-content">
                  <div className="landing-browser-copy">
                    <span>SAMPLE SKILLS · PREVIEW ONLY</span>
                    <h3>Find a skill worth sharing.</h3>
                    <p>These examples show the kinds of topics the community can explore.</p>
                    <div className="landing-browser-search"><Search size={15} /><span>Search skills and topics</span></div>
                  </div>
                  <motion.div
                    className="landing-browser-categories"
                    variants={reducedMotion ? reducedPreviewListVariants : previewListVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.35 }}
                  >
                    {[
                      { name: 'React.js', category: 'Programming & Tech', icon: BookOpen },
                      { name: 'Conversational Spanish', category: 'Languages & Speaking', icon: MessageCircle },
                      { name: 'UI/UX Design in Figma', category: 'Design & Creative Arts', icon: Compass }
                    ].map(({ name, category, icon: Icon }) => (
                      <motion.div
                        key={name}
                        variants={reducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : previewItemVariants}
                        whileHover={reducedMotion ? undefined : { x: 4, borderColor: '#cbd6e2', transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } }}
                      >
                        <span><Icon size={19} /></span><div><strong>{name}</strong><small>{category}</small></div><ArrowUpRight size={15} />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="what-you-can-do" className="landing-feature-section">
        <div className="landing-section-shell">
          <Reveal className="landing-section-heading landing-feature-heading" reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">Made for shared progress</span>
            <h2>Room to learn, connect,<br />and keep going.</h2>
            <p>One place for the people and tools that make peer learning feel possible.</p>
          </Reveal>

          <div className="landing-feature-list">
            <Reveal className="landing-feature-row" reducedMotion={reducedMotion}>
              <div className="landing-feature-index">01 / DISCOVER</div>
              <div className="landing-feature-icon feature-blue"><Compass size={23} /></div>
              <div className="landing-feature-copy"><h3>Find skills and people</h3><p>Browse the skill catalog, explore learning areas, and discover peers to learn with.</p></div>
              <Link className="landing-feature-link" to={exploreTarget} onClick={handleExploreClick} aria-label="Explore skills"><ArrowUpRight size={20} /></Link>
            </Reveal>
            <Reveal className="landing-feature-row" delay={0.06} reducedMotion={reducedMotion}>
              <div className="landing-feature-index">02 / CONNECT</div>
              <div className="landing-feature-icon feature-coral"><UsersRound size={23} /></div>
              <div className="landing-feature-copy"><h3>Learn with a community</h3><p>Take part in study groups, share ideas in the feed, and stay in touch through chat.</p></div>
              <Link className="landing-feature-link" to={isAuthenticated ? '/groups' : '#community-preview'} onClick={handlePreviewClick('community-preview')} aria-label="Preview the Orbitus community"><ArrowUpRight size={20} /></Link>
            </Reveal>
            <Reveal className="landing-feature-row" delay={0.12} reducedMotion={reducedMotion}>
              <div className="landing-feature-index">03 / PRACTICE</div>
              <div className="landing-feature-icon feature-yellow"><CalendarDays size={23} /></div>
              <div className="landing-feature-copy"><h3>Make time to practice</h3><p>Arrange learning sessions with peers and turn a shared interest into a regular practice.</p></div>
              <Link className="landing-feature-link" to={isAuthenticated ? '/bookings' : '#practice-preview'} onClick={handlePreviewClick('practice-preview')} aria-label="Preview learning sessions"><ArrowUpRight size={20} /></Link>
            </Reveal>
            <Reveal className="landing-feature-row" delay={0.18} reducedMotion={reducedMotion}>
              <div className="landing-feature-index">04 / GROW</div>
              <div className="landing-feature-icon feature-green"><Award size={23} /></div>
              <div className="landing-feature-copy"><h3>See your progress</h3><p>Use learning roadmaps, activity history, points, and certificates to recognize your effort.</p></div>
              <Link className="landing-feature-link" to={isAuthenticated ? '/dashboard' : '#progress-preview'} onClick={handlePreviewClick('progress-preview')} aria-label="Preview learning progress"><ArrowUpRight size={20} /></Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="landing-community-section">
        <div className="landing-section-shell landing-community-grid">
          <Reveal className="landing-community-mark" reducedMotion={reducedMotion}>
            <span className="community-mark-ring community-mark-ring-one" />
            <span className="community-mark-ring community-mark-ring-two" />
            <span className="community-mark-center"><MessageCircle size={28} /></span>
            <span className="community-mark-label">LEARN IN GOOD COMPANY</span>
          </Reveal>
          <Reveal className="landing-community-copy" delay={0.08} reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">Progress is shared</span>
            <h2>Every learner has something to teach.</h2>
            <p>Bring what you know. Stay open to what others know. Orbitus makes space for both sides of learning.</p>
            <Link className="landing-text-link" to={destination('/groups')}>{isAuthenticated ? 'Visit study groups' : 'Join the community'} <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      <section id="skills-catalog" className="landing-catalog-section" aria-labelledby="landing-catalog-title">
        <div className="landing-section-shell">
          <Reveal className="landing-catalog-heading" reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">01 / Discover</span>
            <h2 id="landing-catalog-title">Skills Catalog</h2>
            <p>Browse a few example topics from the kinds of skills people can share on Orbitus.</p>
          </Reveal>
          <div className="landing-catalog-grid">
            {[
              { category: 'Programming & Tech', skills: ['React.js', 'API design', 'Docker basics'], icon: BookOpen, tone: 'feature-blue' },
              { category: 'Languages & Speaking', skills: ['Conversational Spanish', 'Public speaking', 'English practice'], icon: MessageCircle, tone: 'feature-coral' },
              { category: 'Design & Creative Arts', skills: ['UI/UX in Figma', 'Digital illustration', 'Visual storytelling'], icon: Compass, tone: 'feature-green' },
              { category: 'Career & Personal Growth', skills: ['Interview practice', 'Portfolio reviews', 'Study habits'], icon: Award, tone: 'feature-yellow' }
            ].map(({ category, skills, icon: Icon, tone }, index) => (
              <Reveal key={category} className="landing-catalog-item" delay={index * 0.06} reducedMotion={reducedMotion}>
                <div className={`landing-catalog-icon ${tone}`}><Icon size={21} /></div>
                <h3>{category}</h3>
                <ul>{skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
              </Reveal>
            ))}
          </div>
          <div className="landing-catalog-action">
            <p>{isAuthenticated ? 'Ready to explore the full catalog?' : 'Sign in to browse skills and connect with people.'}</p>
            <Link className="landing-preview-link" to={destination('/explore', '/login')}>
              {isAuthenticated ? 'Browse all skills' : 'Sign in to browse skills'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section id="community-preview" className="landing-preview-section" aria-labelledby="community-preview-title">
        <div className="landing-section-shell">
          <Reveal className="landing-catalog-heading" reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">02 / Connect</span>
            <h2 id="community-preview-title">Learn with a community</h2>
            <p>Study groups, shared conversations, and a feed help learners stay connected.</p>
          </Reveal>
          <div className="landing-preview-grid">
            <Reveal className="landing-preview-card" reducedMotion={reducedMotion}>
              <div className="landing-catalog-icon feature-coral"><UsersRound size={21} /></div>
              <span className="landing-preview-label">STUDY GROUPS</span>
              <h3>Find your people</h3>
              <p>Join focused spaces to practice a skill and learn alongside others.</p>
              <div className="landing-preview-tags"><span>React study circle</span><span>Language exchange</span></div>
            </Reveal>
            <Reveal className="landing-preview-card" delay={0.07} reducedMotion={reducedMotion}>
              <div className="landing-catalog-icon feature-blue"><MessageCircle size={21} /></div>
              <span className="landing-preview-label">FEED & CHAT</span>
              <h3>Keep the conversation going</h3>
              <p>Share ideas in the feed and message peers as you learn together.</p>
              <div className="landing-preview-tags"><span>Share a learning win</span><span>Ask a question</span></div>
            </Reveal>
          </div>
          {!isAuthenticated && <Link className="landing-preview-link" to="/register">Join the Orbitus community <ArrowRight size={16} /></Link>}
        </div>
      </section>

      <section id="practice-preview" className="landing-preview-section landing-preview-alt" aria-labelledby="practice-preview-title">
        <div className="landing-section-shell">
          <Reveal className="landing-catalog-heading" reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">03 / Practice</span>
            <h2 id="practice-preview-title">Make time to practice</h2>
            <p>Turn a shared interest into a focused session with a peer.</p>
          </Reveal>
          <div className="landing-preview-grid landing-session-grid">
            {[
              { title: 'Build a small React feature', detail: 'Pair practice · Programming', icon: BookOpen },
              { title: 'Practice everyday Spanish', detail: 'Conversation · Languages', icon: MessageCircle },
              { title: 'Review a portfolio together', detail: 'Peer feedback · Design', icon: Compass }
            ].map(({ title, detail, icon: Icon }, index) => (
              <Reveal key={title} className="landing-preview-card landing-session-card" delay={index * 0.06} reducedMotion={reducedMotion}>
                <div className="landing-catalog-icon feature-yellow"><Icon size={21} /></div>
                <span className="landing-preview-label">SESSION IDEA</span>
                <h3>{title}</h3>
                <p>{detail}</p>
              </Reveal>
            ))}
          </div>
          {!isAuthenticated && <Link className="landing-preview-link" to="/register">Create an account to plan a session <ArrowRight size={16} /></Link>}
        </div>
      </section>

      <section id="progress-preview" className="landing-preview-section" aria-labelledby="progress-preview-title">
        <div className="landing-section-shell">
          <Reveal className="landing-catalog-heading" reducedMotion={reducedMotion}>
            <span className="landing-eyebrow">04 / Grow</span>
            <h2 id="progress-preview-title">See your progress</h2>
            <p>Keep the effort visible as you learn, practice, and reach new milestones.</p>
          </Reveal>
          <div className="landing-preview-grid landing-progress-grid">
            <Reveal className="landing-preview-card" reducedMotion={reducedMotion}>
              <div className="landing-catalog-icon feature-blue"><Map size={21} /></div>
              <span className="landing-preview-label">LEARNING ROADMAPS</span>
              <h3>Break a goal into steps</h3>
              <p>Track topics and milestones along a learning path.</p>
              <div className="landing-preview-tags"><span>Plan</span><span>Practice</span><span>Review</span></div>
            </Reveal>
            <Reveal className="landing-preview-card" delay={0.07} reducedMotion={reducedMotion}>
              <div className="landing-catalog-icon feature-green"><Award size={21} /></div>
              <span className="landing-preview-label">MILESTONES</span>
              <h3>Recognize your effort</h3>
              <p>Activity history, points, and certificates can mark progress over time.</p>
              <div className="landing-preview-tags"><span>Activity</span><span>Points</span><span>Certificates</span></div>
            </Reveal>
          </div>
          {!isAuthenticated && <Link className="landing-preview-link" to="/register">Start tracking your learning <ArrowRight size={16} /></Link>}
        </div>
      </section>

      <section className="landing-final-cta">
        <Reveal className="landing-section-shell landing-final-inner" reducedMotion={reducedMotion}>
          <span className="landing-eyebrow">Your next skill starts with a conversation</span>
          <h2>Learn something.<br /><em>Pass it on.</em></h2>
          <p>Find your place in a community built around sharing what we know.</p>
          <div className="landing-hero-actions">
            <Link className="landing-button landing-button-light" to={destination('/dashboard')}>{isAuthenticated ? 'Open dashboard' : 'Get started'} <ArrowRight size={17} /></Link>
            <Link className="landing-cta-secondary" to={exploreTarget} onClick={handleExploreClick}>Explore skills</Link>
          </div>
        </Reveal>
      </section>

      <footer className="landing-footer">
        <div className="landing-section-shell landing-footer-inner">
          <Link to="/" className="landing-brand" aria-label="Orbitus home">
            <BrandLogo size={30} className="landing-brand-mark" />
            <span>Orbitus</span>
          </Link>
          <span className="landing-footer-note">Learn and teach skills together.</span>
          <nav className="landing-footer-links" aria-label="Footer navigation">
            <Link to={exploreTarget} onClick={handleExploreClick}>Explore skills</Link>
            <Link to={destination('/dashboard', '/login')}>{isAuthenticated ? 'Dashboard' : 'Sign in'}</Link>
            <Link to={destination('/dashboard')}>{isAuthenticated ? 'Open dashboard' : 'Create account'}</Link>
          </nav>
          <span className="landing-copyright">© {new Date().getFullYear()} Orbitus</span>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
