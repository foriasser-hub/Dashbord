-- ===========================================
-- LE PARADISIER MANAGER - Script d'initialisation Supabase
-- Copiez-collez ce fichier COMPLET dans l'éditeur SQL de Supabase
-- ===========================================

-- Extension pour UUID (normalement déjà activée sur Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABLE: users
-- Gestion des utilisateurs et authentification
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employe' CHECK (role IN ('admin', 'manager', 'employe', 'comptable')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    must_change_password BOOLEAN DEFAULT false,
    refresh_token_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ===========================================
-- TABLE: clients
-- Clients du restaurant et de l'hôtel
-- ===========================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    type VARCHAR(50) DEFAULT 'Les deux' CHECK (type IN ('Restaurant', 'Appartement', 'Les deux')),
    status VARCHAR(50) DEFAULT 'Nouveau' CHECK (status IN ('Nouveau', 'Fidèle', 'VIP')),
    total_spent DECIMAL(15, 2) DEFAULT 0,
    credit_remaining DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- ===========================================
-- TABLE: rooms
-- Chambres et appartements
-- ===========================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Chambre', 'Appartement')),
    capacity INTEGER DEFAULT 2,
    price_per_night DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Disponible' CHECK (status IN ('Disponible', 'Occupé', 'Nettoyage', 'Maintenance')),
    floor VARCHAR(50),
    description TEXT,
    equipment TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);

-- ===========================================
-- TABLE: reservations
-- Réservations de chambres/appartements
-- ===========================================
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
    price_per_night DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    remaining_amount DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    payment_status VARCHAR(50) DEFAULT 'En attente' CHECK (payment_status IN ('En attente', 'Acompte', 'Payé')),
    status VARCHAR(50) DEFAULT 'En attente' CHECK (status IN ('En attente', 'Confirmée', 'En cours', 'Terminée', 'Annulée')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (check_out > check_in),
    CONSTRAINT check_amounts CHECK (paid_amount >= 0 AND paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_reservations_client ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- ===========================================
-- TABLE: restaurant_orders
-- Commandes restaurant
-- ===========================================
CREATE TABLE IF NOT EXISTS restaurant_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    client_phone VARCHAR(50),
    order_type VARCHAR(50) DEFAULT 'Sur place' CHECK (order_type IN ('Sur place', 'À emporter', 'Livraison')),
    items JSONB NOT NULL,
    items_text TEXT,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    payment_method VARCHAR(50) CHECK (payment_method IN ('Espèces', 'MVola', 'Carte', 'Virement', 'Crédit')),
    payment_status VARCHAR(50) DEFAULT 'En attente' CHECK (payment_status IN ('En attente', 'Payé')),
    status VARCHAR(50) DEFAULT 'À préparer' CHECK (status IN ('À préparer', 'En préparation', 'Prête', 'Livrée', 'Annulée')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_order_amounts CHECK (paid_amount >= 0 AND paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_orders_client ON restaurant_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON restaurant_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON restaurant_orders(created_at);

-- ===========================================
-- TABLE: deliveries
-- Livraisons
-- ===========================================
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES restaurant_orders(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    address TEXT NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    amount_to_collect DECIMAL(12, 2) NOT NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    driver_name VARCHAR(255),
    departure_time TIME,
    eta TIME,
    status VARCHAR(50) DEFAULT 'En attente' CHECK (status IN ('En attente', 'En route', 'Livrée', 'Échec')),
    payment_status VARCHAR(50) DEFAULT 'À encaisser' CHECK (payment_status IN ('À encaisser', 'Payé')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- ===========================================
-- TABLE: stock_items
-- Gestion du stock
-- ===========================================
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Cuisine', 'Boissons', 'Chambre', 'Nettoyage', 'Autre')),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pièce',
    min_quantity DECIMAL(10, 2) DEFAULT 0,
    purchase_price DECIMAL(12, 2) DEFAULT 0,
    selling_price DECIMAL(12, 2) DEFAULT 0,
    supplier VARCHAR(255),
    status VARCHAR(50) GENERATED ALWAYS AS (
        CASE 
            WHEN quantity <= 0 THEN 'Épuisé'
            WHEN quantity <= min_quantity THEN 'Critique'
            WHEN quantity <= min_quantity * 1.5 THEN 'Faible'
            ELSE 'OK'
        END
    ) STORED,
    last_entry DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantity CHECK (quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_stock_category ON stock_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_status ON stock_items(status);

-- ===========================================
-- TABLE: expenses
-- Dépenses
-- ===========================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'Achats restaurant', 'Salaires', 'Électricité', 'Eau', 'Internet', 
        'Maintenance', 'Marketing', 'Transport', 'Loyer', 'Impôts', 'Autre'
    )),
    description TEXT NOT NULL,
    supplier VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('Espèces', 'MVola', 'Carte', 'Virement', 'Chèque')),
    reference VARCHAR(100),
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_expense_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ===========================================
-- TABLE: invoices
-- Factures
-- ===========================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    service_type VARCHAR(50) CHECK (service_type IN ('Hébergement', 'Restaurant', 'Livraison', 'Autre')),
    items JSONB,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    remaining_amount DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status VARCHAR(50) DEFAULT 'En attente' CHECK (status IN ('En attente', 'Payée', 'Annulée')),
    due_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_invoice_amounts CHECK (paid_amount >= 0 AND paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at);

-- ===========================================
-- TABLE: staff (Personnel)
-- ===========================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Présent' CHECK (status IN ('Présent', 'Absent', 'Congé', 'Démission')),
    shift VARCHAR(50),
    tasks TEXT,
    salary DECIMAL(12, 2),
    hire_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- ===========================================
-- TABLE: settings
-- Paramètres de l'application
-- ===========================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- TABLE: audit_logs
-- Journal d'audit
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);

-- ===========================================
-- TABLE: refresh_tokens
-- Tokens de rafraîchissement
-- ===========================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ===========================================
-- FONCTIONS & TRIGGERS
-- ===========================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables avec updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer les numéros de réservation
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reservation_number IS NULL THEN
        NEW.reservation_number := 'RSV-' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-' || 
            LPAD(COALESCE((
                SELECT COUNT(*) + 1 FROM reservations 
                WHERE DATE(created_at) = CURRENT_DATE
            )::text, '1'), 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS generate_reservation_number_trigger ON reservations;
CREATE TRIGGER generate_reservation_number_trigger
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION generate_reservation_number();

-- Fonction pour générer les numéros de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'CMD-' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-' || 
            LPAD(COALESCE((
                SELECT COUNT(*) + 1 FROM restaurant_orders 
                WHERE DATE(created_at) = CURRENT_DATE
            )::text, '1'), 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS generate_order_number_trigger ON restaurant_orders;
CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON restaurant_orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- Fonction pour générer les numéros de livraison
CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_number IS NULL THEN
        NEW.delivery_number := 'LIV-' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-' || 
            LPAD(COALESCE((
                SELECT COUNT(*) + 1 FROM deliveries 
                WHERE DATE(created_at) = CURRENT_DATE
            )::text, '1'), 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS generate_delivery_number_trigger ON deliveries;
CREATE TRIGGER generate_delivery_number_trigger
BEFORE INSERT ON deliveries
FOR EACH ROW
EXECUTE FUNCTION generate_delivery_number();

-- Fonction pour générer les numéros de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'FAC-' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-' || 
            LPAD(COALESCE((
                SELECT COUNT(*) + 1 FROM invoices 
                WHERE DATE(created_at) = CURRENT_DATE
            )::text, '1'), 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;
CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();

-- Fonction pour mettre à jour le total dépensé par client
CREATE OR REPLACE FUNCTION update_client_total_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'reservations' THEN
        UPDATE clients SET total_spent = (
            SELECT COALESCE(SUM(paid_amount), 0) FROM reservations WHERE client_id = NEW.client_id
        ) + (
            SELECT COALESCE(SUM(paid_amount), 0) FROM restaurant_orders WHERE client_id = NEW.client_id
        )
        WHERE id = NEW.client_id;
    ELSIF TG_TABLE_NAME = 'restaurant_orders' THEN
        UPDATE clients SET total_spent = (
            SELECT COALESCE(SUM(paid_amount), 0) FROM reservations WHERE client_id = NEW.client_id
        ) + (
            SELECT COALESCE(SUM(paid_amount), 0) FROM restaurant_orders WHERE client_id = NEW.client_id
        )
        WHERE id = NEW.client_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_client_spent_on_reservation ON reservations;
CREATE TRIGGER update_client_spent_on_reservation
AFTER INSERT OR UPDATE OF paid_amount ON reservations
FOR EACH ROW
WHEN (NEW.client_id IS NOT NULL)
EXECUTE FUNCTION update_client_total_spent();

DROP TRIGGER IF EXISTS update_client_spent_on_order ON restaurant_orders;
CREATE TRIGGER update_client_spent_on_order
AFTER INSERT OR UPDATE OF paid_amount ON restaurant_orders
FOR EACH ROW
WHEN (NEW.client_id IS NOT NULL)
EXECUTE FUNCTION update_client_total_spent();

-- ===========================================
-- DONNÉES INITIALES
-- ===========================================

-- Utilisateur admin par défaut
-- Mot de passe: Admin@123! (hashé avec bcrypt, 12 rounds)
-- IMPORTANT: L'utilisateur DOIT changer ce mot de passe à la première connexion
INSERT INTO users (email, password_hash, name, role, is_active, must_change_password)
VALUES (
    'admin@paradisier.mg',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4q8VxV6qIJvvQYEK',
    'Administrateur',
    'admin',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET must_change_password = true;

-- Paramètres par défaut
INSERT INTO settings (key, value, description) VALUES
    ('business_name', '"Le Paradisier Manager"', 'Nom de l''entreprise'),
    ('currency', '"Ar"', 'Devise'),
    ('phone', '"+261 34 00 000 00"', 'Téléphone'),
    ('address', '"Toamasina, Madagascar"', 'Adresse')
ON CONFLICT (key) DO NOTHING;

-- ===========================================
-- FIN DU SCRIPT
-- ===========================================
-- Vérification: Exécutez cette requête pour confirmer
-- SELECT email, name, role, must_change_password FROM users WHERE email = 'admin@paradisier.mg';
