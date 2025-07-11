-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- para gen_random_uuid()

-- 1. Tabela de usuários (com birth_date)
DROP TABLE IF EXISTS portfolio, transfers, transactions, operations, accounts, fixed_income, stocks, assets, users CASCADE;

CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    cpf           CHAR(14)     UNIQUE NOT NULL,      -- formato 000.000.000‑00
    birth_date    DATE         NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 2. Tabela de contas (CORRIGIDA - type ao invés de tipo)
CREATE TABLE accounts (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID          NOT NULL REFERENCES users(id),
    type          VARCHAR(20)   NOT NULL CHECK (type IN ('corrente','investimento')),
    balance       NUMERIC(18,4) NOT NULL DEFAULT 0,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 3. Tabela genérica de transações
CREATE TABLE transactions (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id   VARCHAR(50)   UNIQUE NOT NULL,  -- ID externo
    user_id          UUID          NOT NULL REFERENCES users(id),
    account_id       UUID          NOT NULL REFERENCES accounts(id),
    tipo             VARCHAR(50)   NOT NULL,         -- ex: depósito, saque, transferência
    valor            NUMERIC(18,4) NOT NULL CHECK (valor >= 0),
    taxa             NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (taxa >= 0),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 4. Transferências
CREATE TABLE transfers (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref  UUID          NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    from_account_id  UUID          NOT NULL REFERENCES accounts(id),
    to_account_id    UUID          NOT NULL REFERENCES accounts(id),
    status           VARCHAR(20)   NOT NULL CHECK (status IN ('pendente','concluída','cancelada')),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 5. Tabela de assets
CREATE TABLE assets (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(255) NOT NULL,
    tipo          VARCHAR(50)  NOT NULL,  -- 'ação' ou 'renda fixa'
    categoria     VARCHAR(50)  NOT NULL,  -- ex.: Agro, Serviços, Tecnologia
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 6. Tabela de ações
CREATE TABLE stocks (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol          VARCHAR(10)   NOT NULL UNIQUE,
    asset_id        UUID          NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    current_price   NUMERIC(18,4) NOT NULL,
    daily_variation NUMERIC(5,2)  NOT NULL
);

-- 7. Tabela de renda fixa
CREATE TABLE fixed_income (
    id                 VARCHAR(20)   PRIMARY KEY,
    asset_id           UUID          NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    name               VARCHAR(255)  NOT NULL,
    rate               NUMERIC(6,4)  NOT NULL,
    rate_type          VARCHAR(10)   NOT NULL CHECK (rate_type IN ('pre','pos')),
    maturity           DATE          NOT NULL,
    minimum_investment NUMERIC(15,2) NOT NULL
);

-- 8. Operações de ativos (compra/venda)
CREATE TABLE operations (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref  UUID          NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    asset_id         UUID          NOT NULL REFERENCES assets(id),
    tipo             VARCHAR(10)   NOT NULL CHECK (tipo IN ('compra','venda')),
    quantidade       INTEGER       NOT NULL CHECK (quantidade > 0),
    preco_unitario   NUMERIC(18,4) NOT NULL CHECK (preco_unitario >= 0),
    imposto_retido   NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (imposto_retido >= 0),
    executed_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 9. Portfolio (CORRIGIDA - usando UUIDs)
CREATE TABLE portfolio (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    asset_symbol VARCHAR(10) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    average_price DECIMAL(15,2) NOT NULL,
    purchase_price DECIMAL(15,2) NOT NULL,
    purchase_date TIMESTAMP DEFAULT NOW(),
    transaction_ref UUID REFERENCES transactions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, asset_symbol)
);

-- 10. Exemplo de inserts a partir dos mocks fornecidos
INSERT INTO users (name, email, cpf, birth_date) VALUES
('João Silva','joao.silva@email.com','123.456.789-00','1990-01-15'),
('Maria Santos','maria.santos@email.com','987.654.321-00','1985-05-20'),
('Pedro Oliveira','pedro.oliveira@email.com','456.789.123-00','1992-08-10'),
('Ana Costa','ana.costa@email.com','789.123.456-00','1988-11-25'),
('Carlos Pereira','carlos.pereira@email.com','321.654.987-00','1995-03-30'),
('Juliana Lima','juliana.lima@email.com','654.987.321-00','1993-07-12'),
('Lucas Ferreira','lucas.ferreira@email.com','147.258.369-00','1991-09-18'),
('Mariana Alves','mariana.alves@email.com','258.369.147-00','1987-12-05'),
('Rafael Souza','rafael.souza@email.com','369.147.258-00','1994-04-22'),
('Beatriz Martins','beatriz.martins@email.com','147.369.258-00','1996-06-08');

-- Inserir assets para ações
INSERT INTO assets (nome, tipo, categoria) VALUES
-- Ações do setor Agro
('Boi Bom', 'ação', 'Agro'),
('Boi Nobre', 'ação', 'Agro'),
('Soja Brasil', 'ação', 'Agro'),
('Café Premium', 'ação', 'Agro'),
('Milho Brasil', 'ação', 'Agro'),
('Cana Açúcar', 'ação', 'Agro'),
('Frutas Brasil', 'ação', 'Agro'),
('Hortaliças BR', 'ação', 'Agro'),
('Pecuária BR', 'ação', 'Agro'),
('Pesca Brasil', 'ação', 'Agro'),
('Flores BR', 'ação', 'Agro'),
('Mel Brasil', 'ação', 'Agro'),
('Orgânicos BR', 'ação', 'Agro'),
('Vegano BR', 'ação', 'Agro'),

-- Ações do setor Serviços
('Água pra Todos', 'ação', 'Serviços'),
('Energia BR', 'ação', 'Serviços'),
('Limpa Cidade', 'ação', 'Serviços'),
('Gás Natural', 'ação', 'Serviços'),
('Limpeza Total', 'ação', 'Serviços'),
('Telecom Brasil', 'ação', 'Serviços'),
('Transporte BR', 'ação', 'Serviços'),
('Logística BR', 'ação', 'Serviços'),
('Educação BR', 'ação', 'Serviços'),
('Saúde BR', 'ação', 'Serviços'),
('Turismo BR', 'ação', 'Serviços'),
('Hotéis BR', 'ação', 'Serviços'),
('Cultura BR', 'ação', 'Serviços'),
('Esportes BR', 'ação', 'Serviços'),

-- Ações do setor Tecnologia
('NuvemCinza', 'ação', 'Tecnologia'),
('ChipZilla', 'ação', 'Tecnologia'),
('SoftTech', 'ação', 'Tecnologia'),
('Dados Brasil', 'ação', 'Tecnologia'),
('Internet BR', 'ação', 'Tecnologia'),
('Segurança Digital', 'ação', 'Tecnologia'),
('Mobilidade BR', 'ação', 'Tecnologia'),
('Aplicativos BR', 'ação', 'Tecnologia'),
('Games BR', 'ação', 'Tecnologia'),
('Redes Sociais', 'ação', 'Tecnologia'),
('Inteligência BR', 'ação', 'Tecnologia'),
('Robótica BR', 'ação', 'Tecnologia');

-- Inserir stocks com referência aos assets
INSERT INTO stocks (symbol, asset_id, current_price, daily_variation) VALUES
('BOIB3', (SELECT id FROM assets WHERE nome = 'Boi Bom'), 25.50, 1.2),
('BOIN3', (SELECT id FROM assets WHERE nome = 'Boi Nobre'), 18.75, -0.8),
('AGUA3', (SELECT id FROM assets WHERE nome = 'Água pra Todos'), 42.30, 2.1),
('ENER3', (SELECT id FROM assets WHERE nome = 'Energia BR'), 35.80, 0.5),
('NUV3', (SELECT id FROM assets WHERE nome = 'NuvemCinza'), 120.45, 3.2),
('CHIP3', (SELECT id FROM assets WHERE nome = 'ChipZilla'), 95.60, -1.5),
('SOJA3', (SELECT id FROM assets WHERE nome = 'Soja Brasil'), 32.40, 0.8),
('CAFE3', (SELECT id FROM assets WHERE nome = 'Café Premium'), 28.90, -0.3),
('LIXO3', (SELECT id FROM assets WHERE nome = 'Limpa Cidade'), 15.75, 1.0),
('GAS3', (SELECT id FROM assets WHERE nome = 'Gás Natural'), 38.20, -0.5),
('SOFT3', (SELECT id FROM assets WHERE nome = 'SoftTech'), 85.30, 2.3),
('DADOS3', (SELECT id FROM assets WHERE nome = 'Dados Brasil'), 72.10, -1.2),
('MILH3', (SELECT id FROM assets WHERE nome = 'Milho Brasil'), 22.80, 0.4),
('CANAA3', (SELECT id FROM assets WHERE nome = 'Cana Açúcar'), 19.45, -0.7),
('LIMP3', (SELECT id FROM assets WHERE nome = 'Limpeza Total'), 12.30, 0.9),
('TEL3', (SELECT id FROM assets WHERE nome = 'Telecom Brasil'), 45.60, -0.2),
('INT3', (SELECT id FROM assets WHERE nome = 'Internet BR'), 65.40, 1.8),
('SEG3', (SELECT id FROM assets WHERE nome = 'Segurança Digital'), 88.90, -0.9),
('FRUT3', (SELECT id FROM assets WHERE nome = 'Frutas Brasil'), 27.30, 0.6),
('HORT3', (SELECT id FROM assets WHERE nome = 'Hortaliças BR'), 21.80, -0.4),
('TRANS3', (SELECT id FROM assets WHERE nome = 'Transporte BR'), 33.50, 1.1),
('LOG3', (SELECT id FROM assets WHERE nome = 'Logística BR'), 29.70, -0.6),
('MOB3', (SELECT id FROM assets WHERE nome = 'Mobilidade BR'), 78.20, 2.0),
('APP3', (SELECT id FROM assets WHERE nome = 'Aplicativos BR'), 92.40, -1.0),
('PECU3', (SELECT id FROM assets WHERE nome = 'Pecuária BR'), 24.60, 0.7),
('PESCA3', (SELECT id FROM assets WHERE nome = 'Pesca Brasil'), 20.10, -0.5),
('EDUC3', (SELECT id FROM assets WHERE nome = 'Educação BR'), 16.80, 0.8),
('SAUDE3', (SELECT id FROM assets WHERE nome = 'Saúde BR'), 41.20, -0.3),
('GAME3', (SELECT id FROM assets WHERE nome = 'Games BR'), 68.90, 1.5),
('REDE3', (SELECT id FROM assets WHERE nome = 'Redes Sociais'), 105.30, -0.8),
('FLOR3', (SELECT id FROM assets WHERE nome = 'Flores BR'), 19.40, 0.5),
('MEL3', (SELECT id FROM assets WHERE nome = 'Mel Brasil'), 23.70, -0.4),
('TUR3', (SELECT id FROM assets WHERE nome = 'Turismo BR'), 14.90, 0.9),
('HOTEL3', (SELECT id FROM assets WHERE nome = 'Hotéis BR'), 37.60, -0.2),
('IA3', (SELECT id FROM assets WHERE nome = 'Inteligência BR'), 115.80, 2.2),
('ROBO3', (SELECT id FROM assets WHERE nome = 'Robótica BR'), 98.40, -1.1),
('ORGA3', (SELECT id FROM assets WHERE nome = 'Orgânicos BR'), 26.20, 0.6),
('VEG3', (SELECT id FROM assets WHERE nome = 'Vegano BR'), 22.50, -0.3),
('CULT3', (SELECT id FROM assets WHERE nome = 'Cultura BR'), 13.80, 0.7),
('ESPORT3', (SELECT id FROM assets WHERE nome = 'Esportes BR'), 31.40, -0.5);

-- Inserir assets para renda fixa
INSERT INTO assets (nome, tipo, categoria) VALUES
('CDB Banco A', 'renda fixa', 'CDB'),
('CDB Banco B', 'renda fixa', 'CDB'),
('Tesouro Selic 2025', 'renda fixa', 'Tesouro Direto'),
('Tesouro IPCA+ 2026', 'renda fixa', 'Tesouro Direto'),
('CDB Banco C', 'renda fixa', 'CDB'),
('Tesouro Prefixado 2027', 'renda fixa', 'Tesouro Direto');

-- Inserir fixed_income com referência aos assets
INSERT INTO fixed_income (id, asset_id, name, rate, rate_type, maturity, minimum_investment) VALUES
('CDB001', (SELECT id FROM assets WHERE nome = 'CDB Banco A'), 'CDB Banco A', 0.12, 'pre', '2024-12-31', 1000.00),
('CDB002', (SELECT id FROM assets WHERE nome = 'CDB Banco B'), 'CDB Banco B', 0.105, 'pre', '2025-06-30', 5000.00),
('TD001', (SELECT id FROM assets WHERE nome = 'Tesouro Selic 2025'), 'Tesouro Selic 2025', 0.115, 'pos', '2025-01-01', 100.00),
('TD002', (SELECT id FROM assets WHERE nome = 'Tesouro IPCA+ 2026'), 'Tesouro IPCA+ 2026', 0.055, 'pos', '2026-01-01', 100.00),
('CDB003', (SELECT id FROM assets WHERE nome = 'CDB Banco C'), 'CDB Banco C', 0.13, 'pre', '2024-09-30', 2000.00),
('TD003', (SELECT id FROM assets WHERE nome = 'Tesouro Prefixado 2027'), 'Tesouro Prefixado 2027', 0.12, 'pre', '2027-01-01', 100.00);

-- Verificar se os dados foram inseridos corretamente
SELECT 'Users inseridos:' as info, COUNT(*) as quantidade FROM users;
SELECT 'Assets inseridos:' as info, COUNT(*) as quantidade FROM assets;
SELECT 'Stocks inseridos:' as info, COUNT(*) as quantidade FROM stocks;
SELECT 'Fixed Income inseridos:' as info, COUNT(*) as quantidade FROM fixed_income;
