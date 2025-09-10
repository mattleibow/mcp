class MCPServerBrowser {
    constructor() {
        this.servers = [];
        this.filteredServers = [];
        this.categories = {};
        
        this.searchInput = document.getElementById('searchInput');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.typeFilter = document.getElementById('typeFilter');
        this.clearFiltersBtn = document.getElementById('clearFilters');
        this.serversGrid = document.getElementById('serversGrid');
        this.resultCount = document.getElementById('resultCount');
        this.noResults = document.getElementById('noResults');
        
        this.init();
    }
    
    async init() {
        await this.loadServers();
        this.setupEventListeners();
        this.renderServers();
    }
    
    async loadServers() {
        try {
            const response = await fetch('servers.json');
            const data = await response.json();
            this.servers = data.servers;
            this.categories = data.categories;
            this.filteredServers = [...this.servers];
        } catch (error) {
            console.error('Failed to load servers:', error);
            this.showError('Failed to load MCP servers. Please try again later.');
        }
    }
    
    setupEventListeners() {
        this.searchInput.addEventListener('input', (e) => {
            this.applyFilters();
        });
        
        this.categoryFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.typeFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.clearFiltersBtn.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Debounce search input for better performance
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.applyFilters();
            }, 300);
        });
    }
    
    applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        const categoryFilter = this.categoryFilter.value;
        const typeFilter = this.typeFilter.value;
        
        this.filteredServers = this.servers.filter(server => {
            const matchesSearch = !searchTerm || 
                server.name.toLowerCase().includes(searchTerm) ||
                server.description.toLowerCase().includes(searchTerm) ||
                server.category.toLowerCase().includes(searchTerm);
                
            const matchesCategory = !categoryFilter || server.category === categoryFilter;
            const matchesType = !typeFilter || server.type === typeFilter;
            
            return matchesSearch && matchesCategory && matchesType;
        });
        
        this.renderServers();
    }
    
    clearFilters() {
        this.searchInput.value = '';
        this.categoryFilter.value = '';
        this.typeFilter.value = '';
        this.filteredServers = [...this.servers];
        this.renderServers();
    }
    
    renderServers() {
        this.updateResultCount();
        
        if (this.filteredServers.length === 0) {
            this.showNoResults();
            return;
        }
        
        this.hideNoResults();
        
        const serversHTML = this.filteredServers.map(server => this.createServerCard(server)).join('');
        this.serversGrid.innerHTML = serversHTML;
    }
    
    createServerCard(server) {
        const categoryInfo = this.categories[server.category] || { name: server.category, icon: 'fas fa-folder' };
        const typeClass = server.type === 'Local' ? 'badge-type-local' : 'badge-type-remote';
        
        const links = this.createServerLinks(server);
        
        return `
            <div class="server-card" data-category="${server.category}" data-type="${server.type}">
                <div class="server-header">
                    <div>
                        <h3 class="server-title">${this.escapeHtml(server.name)}</h3>
                    </div>
                    <div class="server-badges">
                        <span class="badge badge-category">
                            <i class="${categoryInfo.icon}"></i>
                            ${categoryInfo.name}
                        </span>
                        <span class="badge ${typeClass}">${server.type}</span>
                    </div>
                </div>
                <p class="server-description">${this.escapeHtml(server.description)}</p>
                <div class="server-links">
                    ${links}
                </div>
            </div>
        `;
    }
    
    createServerLinks(server) {
        const links = [];
        
        // Primary repository link
        if (server.repository) {
            const isGitHub = server.repository.includes('github.com');
            const icon = isGitHub ? 'fab fa-github' : 'fas fa-external-link-alt';
            links.push(`
                <a href="${server.repository}" target="_blank" class="server-link">
                    <i class="${icon}"></i>
                    Repository
                </a>
            `);
        }
        
        // Additional links if available
        if (server.links) {
            if (server.links.documentation) {
                links.push(`
                    <a href="${server.links.documentation}" target="_blank" class="server-link">
                        <i class="fas fa-book"></i>
                        Documentation
                    </a>
                `);
            }
            
            if (server.links.readme) {
                links.push(`
                    <a href="${server.links.readme}" target="_blank" class="server-link">
                        <i class="fas fa-file-alt"></i>
                        README
                    </a>
                `);
            }
            
            if (server.links.releases) {
                links.push(`
                    <a href="${server.links.releases}" target="_blank" class="server-link">
                        <i class="fas fa-tags"></i>
                        Releases
                    </a>
                `);
            }
        }
        
        // Remote endpoint if available
        if (server.endpoint) {
            links.push(`
                <a href="${server.endpoint}" target="_blank" class="server-link">
                    <i class="fas fa-satellite-dish"></i>
                    Endpoint
                </a>
            `);
        }
        
        return links.join('');
    }
    
    updateResultCount() {
        const count = this.filteredServers.length;
        this.resultCount.textContent = count;
    }
    
    showNoResults() {
        this.noResults.style.display = 'block';
        this.serversGrid.style.display = 'none';
    }
    
    hideNoResults() {
        this.noResults.style.display = 'none';
        this.serversGrid.style.display = 'grid';
    }
    
    showError(message) {
        this.serversGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MCPServerBrowser();
});

// Add some CSS for the error message
const style = document.createElement('style');
style.textContent = `
    .error-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 2rem;
        color: var(--error-color);
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: var(--border-radius);
    }
    
    .error-message i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.7;
    }
    
    .error-message p {
        font-size: 1.1rem;
        margin: 0;
    }
`;
document.head.appendChild(style);