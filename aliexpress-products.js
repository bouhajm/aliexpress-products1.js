// Configuration AliExpress
const ALIEXPRESS_CONFIG = {
    appKey: '505156',
    appSecret: '70GLzSvnXctkPx06b0J1gosRSLdkxLT9',
    trackingId: 'nvblog', // Votre tracking ID d'affiliation
    apiUrl: 'https://api.aliexpress.com/v2/ali.express.affiliate.product.query',
};

class AliExpressAPI {
    constructor() {
        this.config = ALIEXPRESS_CONFIG;
        this.productsContainer = document.getElementById('featured-products');
        this.loadingElement = document.getElementById('loading-products');
        this.categories = [
            'WOMEN_CLOTHING',
            'MEN_CLOTHING',
            'PHONES',
            'COMPUTER_OFFICE',
            'CONSUMER_ELECTRONICS'
        ];
    }

    // Générer la signature pour l'API AliExpress
    generateSignature(parameters) {
        const sortedParams = Object.keys(parameters).sort().map(key => 
            `${key}${parameters[key]}`
        ).join('');
        
        const signStr = this.config.appSecret + sortedParams + this.config.appSecret;
        return CryptoJS.MD5(signStr).toString().toUpperCase();
    }

    // Préparer les paramètres de la requête
    prepareRequestParameters() {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        const parameters = {
            app_key: this.config.appKey,
            timestamp: timestamp,
            format: 'json',
            sign_method: 'md5',
            v: '2.0',
            fields: 'commission_rate,sale_price,app_sale_price,app_sale_price_currency,evaluate_rate,product_id,product_main_image_url,product_small_image_urls,product_title,promotion_link,shop_id,shop_url',
            keywords: '',
            category_ids: this.categories.join(','),
            target_currency: 'EUR',
            target_language: 'FR',
            tracking_id: this.config.trackingId,
            page_size: '20'
        };

        parameters.sign = this.generateSignature(parameters);
        return parameters;
    }

    // Construire l'URL de la requête
    buildRequestUrl(parameters) {
        const queryString = Object.keys(parameters)
            .map(key => `${key}=${encodeURIComponent(parameters[key])}`)
            .join('&');
        return `${this.config.apiUrl}?${queryString}`;
    }

    // Charger les produits depuis AliExpress
    async loadProducts() {
        try {
            this.showLoading();
            const parameters = this.prepareRequestParameters();
            const url = this.buildRequestUrl(parameters);

            const response = await fetch(url);
            const data = await response.json();

            if (data.error_response) {
                throw new Error(data.error_response.msg);
            }

            const products = data.response_result.result_list;
            this.displayProducts(products);
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    // Afficher les produits dans le DOM
    displayProducts(products) {
        if (!this.productsContainer) return;

        this.productsContainer.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.product_main_image_url}" alt="${product.product_title}">
                </div>
                <div class="product-info">
                    <h3>${this.truncateText(product.product_title, 50)}</h3>
                    <div class="product-rating">
                        ${this.generateRatingStars(product.evaluate_rate)}
                    </div>
                    <p class="price">${product.app_sale_price} ${product.app_sale_price_currency}</p>
                    <div class="product-actions">
                        <a href="${product.promotion_link}" class="buy-button" target="_blank" rel="nofollow">
                            Voir l'offre
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Générer les étoiles de notation
    generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return `
            ${'★'.repeat(fullStars)}
            ${hasHalfStar ? '⯨' : ''}
            ${'☆'.repeat(emptyStars)}
            <span class="rating-number">(${rating})</span>
        `;
    }

    // Tronquer le texte
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    showError(message) {
        if (this.productsContainer) {
            this.productsContainer.innerHTML = `
                <div class="error-message">
                    Une erreur est survenue : ${message}
                </div>
            `;
        }
    }

    // Initialiser le rafraîchissement périodique
    startPeriodicRefresh(intervalHours = 6) {
        this.loadProducts();
        setInterval(() => this.loadProducts(), intervalHours * 60 * 60 * 1000);
    }
}

// Ajouter la bibliothèque CryptoJS pour la signature MD5
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
script.onload = () => {
    // Initialiser l'API AliExpress une fois CryptoJS chargé
    const aliExpressAPI = new AliExpressAPI();
    aliExpressAPI.startPeriodicRefresh();
};
document.head.appendChild(script);
