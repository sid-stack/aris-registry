import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Search as SearchIcon, Book, ArrowLeft, Clock, User, Share2 } from 'lucide-react';
import { articles } from './data/articles';
import AdUnit from './components/AdUnit';
import './styles/Medium.css';

const Navbar = () => (
  <nav className="navbar">
    <div className="container" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'black', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.04em' }}>
        BidSmith <span style={{ fontWeight: 400, color: '#757575' }}>Blog</span>
      </Link>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link to="/search" style={{ color: '#757575' }}><SearchIcon size={20} /></Link>
        <button className="btn-primary">Become a Member</button>
      </div>
    </div>
  </nav>
);

const Home = () => {
  const featured = articles[0];
  const remaining = articles.slice(1);

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      {/* Featured Article */}
      <Link to={`/article/${featured.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ display: 'flex', gap: '48px', marginBottom: '80px', borderBottom: '1px solid #f2f2f2', paddingBottom: '40px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: 20, height: 20, background: '#191919', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{featured.author}</span>
            </div>
            <h1 className="article-heading">{featured.title}</h1>
            <p style={{ color: '#757575', fontSize: '16px', marginBottom: '20px' }}>{featured.excerpt}</p>
            <div style={{ color: '#757575', fontSize: '13px' }}>{featured.date} · {featured.readTime} reading time</div>
          </div>
          <div style={{ width: '300px', height: '200px', background: '#f2f2f2', borderRadius: '4px' }}></div>
        </div>
      </Link>

      {/* Article Grid */}
      <AdUnit slot="7890123456" /> {/* Placeholder slot, user will replace */}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '48px', marginTop: '40px' }}>
        {remaining.map(article => (
          <Link key={article.id} to={`/article/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="hover-glow">
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{article.author}</span>
              </div>
              <h3 className="article-heading" style={{ fontSize: '18px' }}>{article.title}</h3>
              <p style={{ color: '#757575', fontSize: '14px', marginBottom: '12px' }}>{article.excerpt}</p>
              <div style={{ color: '#757575', fontSize: '12px' }}>{article.date} · {article.readTime}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const Article = () => {
  const { id } = useParams();
  const article = articles.find(a => a.id === id);

  if (!article) return <div>Article not found</div>;

  return (
    <div className="container" style={{ marginTop: '60px', paddingBottom: '100px' }}>
      <article className="article-content" style={{ margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <User size={40} strokeWidth={1} style={{ background: '#f2f2f2', padding: '8px', borderRadius: '50%' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{article.author}</div>
            <div style={{ fontSize: '14px', color: '#757575' }}>{article.date} · {article.readTime} Read</div>
          </div>
        </div>
        
        <h1 className="article-heading" style={{ marginBottom: '32px' }}>{article.title}</h1>
        
        <div className="serif">
          {article.content}
        </div>

        <AdUnit slot="1234567890" />

        <div style={{ 
          marginTop: '60px', 
          borderTop: '1px solid #f2f2f2', 
          paddingTop: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
           <div style={{ display: 'flex', gap: '20px', color: '#757575' }}>
             <Share2 size={20} style={{ cursor: 'pointer' }} />
             <Book size={20} style={{ cursor: 'pointer' }} />
           </div>
           <Link to="/" style={{ color: '#1a8917', fontWeight: 600, textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </article>
    </div>
  );
};

const Search = () => {
  const [query, setQuery] = useState('');
  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.content.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="container" style={{ marginTop: '60px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <input 
          autoFocus
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GovCon Intelligence..."
          style={{ fontSize: '32px', padding: '16px 0', borderBottom: '1px solid #f2f2f2', borderRadius: 0, background: 'transparent' }}
        />
        
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {query && filtered.map(article => (
            <Link key={article.id} to={`/article/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="hover-glow">
                <h3 className="article-heading" style={{ fontSize: '22px' }}>{article.title}</h3>
                <p style={{ color: '#757575', fontSize: '15px' }}>{article.excerpt}</p>
              </div>
            </Link>
          ))}
          {query && filtered.length === 0 && (
            <div style={{ color: '#757575', fontSize: '16px' }}>No matches found for "{query}". Try "FAR" or "SAM".</div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:id" element={<Article />} />
        <Route path="/search" element={<Search />} />
      </Routes>
      <footer style={{ borderTop: '1px solid #f2f2f2', marginTop: '100px', padding: '40px 0' }}>
         <div className="container" style={{ color: '#757575', fontSize: '13px' }}>
            © 2026 BidSmith Intelligence. Sovereign Protocol Content.
         </div>
      </footer>
    </Router>
  );
};

export default App;
