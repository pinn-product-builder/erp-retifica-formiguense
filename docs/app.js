// ===== Theme Management =====
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Load saved theme or default to light
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// ===== Search Functionality =====
const searchToggle = document.getElementById('search-toggle');
const searchModal = document.getElementById('search-modal');
const searchInput = document.getElementById('search-input');
const searchClose = document.getElementById('search-close');
const searchResults = document.getElementById('search-results');

// Search index - will be populated from markdown files
let searchIndex = [];

// Toggle search modal
searchToggle?.addEventListener('click', () => {
  searchModal.classList.remove('hidden');
  searchInput.focus();
});

searchClose?.addEventListener('click', () => {
  searchModal.classList.add('hidden');
  searchInput.value = '';
  searchResults.innerHTML = '';
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
    searchModal.classList.add('hidden');
    searchInput.value = '';
    searchResults.innerHTML = '';
  }
});

// Close on background click
searchModal?.addEventListener('click', (e) => {
  if (e.target === searchModal) {
    searchModal.classList.add('hidden');
    searchInput.value = '';
    searchResults.innerHTML = '';
  }
});

// Search input handler
searchInput?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  
  if (query.length < 2) {
    searchResults.innerHTML = '';
    return;
  }
  
  performSearch(query);
});

function performSearch(query) {
  // Simple search implementation
  // In a real implementation, this would search through actual markdown files
  const mockResults = [
    {
      title: 'Início Rápido',
      path: 'quick-start.md',
      excerpt: 'Guia rápido para começar a usar o sistema...'
    },
    {
      title: 'Visão Geral do Sistema',
      path: 'architecture/system-overview.md',
      excerpt: 'Arquitetura geral e componentes principais...'
    },
    {
      title: 'Dashboard',
      path: 'modules/dashboard/README.md',
      excerpt: 'Módulo de dashboard com KPIs e métricas...'
    },
    {
      title: 'Módulo de Operações',
      path: 'modules/operations/README.md',
      excerpt: 'Gestão de ordens de serviço e workflow...'
    },
    {
      title: 'Multi-tenancy',
      path: 'architecture/multitenancy.md',
      excerpt: 'Sistema multi-tenant com isolamento de dados...'
    }
  ].filter(item => 
    item.title.toLowerCase().includes(query) ||
    item.excerpt.toLowerCase().includes(query)
  );
  
  displaySearchResults(mockResults);
}

function displaySearchResults(results) {
  if (results.length === 0) {
    searchResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--color-text-muted);">Nenhum resultado encontrado</div>';
    return;
  }
  
  searchResults.innerHTML = results.map(result => `
    <div class="search-result-item" onclick="navigateToDoc('${result.path}')">
      <div class="search-result-title">${result.title}</div>
      <div class="search-result-path">${result.path}</div>
    </div>
  `).join('');
}

function navigateToDoc(path) {
  // Load markdown content dynamically
  loadMarkdownContent(path);
  // Close search modal if open
  const searchModal = document.getElementById('search-modal');
  if (searchModal && !searchModal.classList.contains('hidden')) {
    searchModal.classList.add('hidden');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
  }
}

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ===== Active Navigation Link =====
function updateActiveNavLink() {
  const sections = document.querySelectorAll('[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  let currentSection = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= (sectionTop - 100)) {
      currentSection = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSection}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveNavLink);
window.addEventListener('load', updateActiveNavLink);

// ===== Dynamic Content Loading =====
async function loadMarkdownContent(path) {
  try {
    // If path doesn't end with .md and isn't a directory, add .md
    let finalPath = path;
    if (!path.endsWith('.md') && !path.endsWith('/')) {
      finalPath = path + '.md';
    } else if (path.endsWith('/')) {
      // If it's a directory, load README.md
      finalPath = path + 'README.md';
    }
    
    // Fetch markdown file
    const response = await fetch(finalPath);
    if (!response.ok) throw new Error('File not found');
    
    const markdown = await response.text();
    
    // Parse markdown to HTML using marked.js
    const html = marked.parse(markdown);
    
    // Get or create content area
    let contentArea = document.getElementById('dynamic-content');
    if (!contentArea) {
      contentArea = document.createElement('div');
      contentArea.id = 'dynamic-content';
      contentArea.className = 'dynamic-content';
      const mainContent = document.querySelector('.content-area');
      if (mainContent) {
        mainContent.appendChild(contentArea);
      }
    }
    
    // Hide sections grid and show dynamic content
    const sectionsGrid = document.querySelector('.sections-grid');
    const featuresSection = document.querySelector('.features-section');
    const gettingStartedSection = document.querySelector('.getting-started-section');
    
    if (sectionsGrid) sectionsGrid.style.display = 'none';
    if (featuresSection) featuresSection.style.display = 'none';
    if (gettingStartedSection) gettingStartedSection.style.display = 'none';
    
    contentArea.innerHTML = html;
    contentArea.classList.remove('hidden');
    contentArea.style.display = 'block';
    
    // Render Mermaid diagrams
    if (typeof mermaid !== 'undefined') {
      mermaid.init(undefined, contentArea.querySelectorAll('.language-mermaid, code.language-mermaid'));
    }
    
    // Highlight code blocks
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(contentArea);
    }
    
    // Make links in markdown work
    contentArea.querySelectorAll('a[href$=".md"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        loadMarkdownContent(href);
      });
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error('Error loading content:', error);
    const contentArea = document.getElementById('dynamic-content');
    if (contentArea) {
      contentArea.innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>⚠️ Conteúdo não encontrado</h2><p>O arquivo solicitado não foi encontrado.</p><p><a href="javascript:location.reload()">← Voltar ao início</a></p></div>';
      contentArea.classList.remove('hidden');
      contentArea.style.display = 'block';
    }
  }
}

// ===== Initialize Mermaid =====
mermaid.initialize({
  startOnLoad: true,
  theme: html.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

// Update Mermaid theme when theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-theme') {
      const theme = html.getAttribute('data-theme');
      mermaid.initialize({
        theme: theme === 'dark' ? 'dark' : 'default'
      });
    }
  });
});

observer.observe(html, { attributes: true });

// ===== Card Click Handlers =====
document.querySelectorAll('.section-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (!e.target.classList.contains('card-link')) {
      const link = card.querySelector('.card-link');
      if (link) {
        window.location.href = link.getAttribute('href');
      }
    }
  });
});

// ===== Breadcrumb Navigation =====
function updateBreadcrumb() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  
  if (parts.length > 0) {
    // Create breadcrumb HTML
    // This would be more sophisticated in a real implementation
  }
}

// ===== Performance Optimization =====
// Lazy load images
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ===== Console Welcome Message =====
console.log('%c🚀 ERP Retífica Formiguense', 'font-size: 24px; font-weight: bold; color: #FF6633;');
console.log('%cDocumentação do Sistema v1.0', 'font-size: 14px; color: #666;');
console.log('%cPara mais informações, visite: https://github.com/pinn-product-builder/erp-retifica-formiguense', 'font-size: 12px; color: #999;');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Documentation site loaded successfully');
  updateBreadcrumb();
});