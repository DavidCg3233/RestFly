-- ============================================================
--  SIGIR - Sistema de Gestión Integral de Restaurante
--  Base de Datos Definitiva (Motor: MySQL 8+)
-- ============================================================

CREATE DATABASE RestFly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE RestFly;

CREATE TABLE rol (
    id_rol          INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol      VARCHAR(30)  NOT NULL,
    descripcion     TEXT
);

CREATE TABLE estado_usuario (
    id_estado_usuario   INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado_usuario VARCHAR(20) NOT NULL
);

CREATE TABLE estado_mesa (
    id_estado_mesa      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado_mesa  VARCHAR(20) NOT NULL
);

CREATE TABLE estado_producto (
    id_estado_producto      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado_producto  VARCHAR(30) NOT NULL 
);

CREATE TABLE estado_pedido (
    id_estado_pedido    INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado_pedido VARCHAR(20) NOT NULL
);

CREATE TABLE estado_detalle_pedido (
    id_estado_detalle       INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado_detalle   VARCHAR(20) NOT NULL 
);

CREATE TABLE metodo_pago (
    id_metodo_pago      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_metodo_pago  VARCHAR(30) NOT NULL 
);

CREATE TABLE tipo_comprobante (
    id_tipo_comprobante     INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo_comprobante VARCHAR(20) NOT NULL
);

CREATE TABLE tipo_movimiento (
    id_tipo_movimiento      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo_movimiento  VARCHAR(20) NOT NULL
);

CREATE TABLE categoria_producto (
    id_categoria    INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion     TEXT
);

CREATE TABLE area_trabajo (
    id_area     INT AUTO_INCREMENT PRIMARY KEY,
    nombre_area VARCHAR(30) NOT NULL 
);

CREATE TABLE usuario (
    id_usuario          INT AUTO_INCREMENT PRIMARY KEY,
    username            VARCHAR(50)  NOT NULL UNIQUE,
    primer_nombre       VARCHAR(50)  NOT NULL,
    segundo_nombre      VARCHAR(50),
    primer_apellido     VARCHAR(50)  NOT NULL,
    segundo_apellido    VARCHAR(50),
    contrasena          VARCHAR(255) NOT NULL,
    telefono            VARCHAR(15),
    id_rol              INT NOT NULL,
    id_estado_usuario   INT NOT NULL,
    fecha_creacion      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE RESTRICT,
    FOREIGN KEY (id_estado_usuario) REFERENCES estado_usuario(id_estado_usuario) ON DELETE RESTRICT
);

CREATE TABLE auditoria (
    id_auditoria            INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario              INT NOT NULL,
    accion_realizada        TEXT NOT NULL,
    modulo_afectado         VARCHAR(50),
    id_registro_afectado    INT NULL,
    valor_anterior          TEXT NULL, 
    valor_nuevo             TEXT NULL, 
    ip_usuario              VARCHAR(45) NULL,
    fecha_hora              DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

CREATE TABLE mesa (
    id_mesa         INT AUTO_INCREMENT PRIMARY KEY,
    numero_mesa     INT NOT NULL UNIQUE,
    capacidad       INT NOT NULL,
    id_estado_mesa  INT NOT NULL,
    FOREIGN KEY (id_estado_mesa) REFERENCES estado_mesa(id_estado_mesa) ON DELETE RESTRICT
);

CREATE TABLE reserva (
    id_reserva          INT AUTO_INCREMENT PRIMARY KEY,
    id_mesa             INT NOT NULL,
    nombre_cliente      VARCHAR(100) NOT NULL,
    fecha_reserva       DATETIME NOT NULL,
    numero_personas     INT,
    telefono_contacto   VARCHAR(15),
    activa              BOOLEAN DEFAULT TRUE,
    fecha_creacion      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mesa) REFERENCES mesa(id_mesa) ON DELETE RESTRICT
);

CREATE TABLE producto (
    id_producto         INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto     VARCHAR(100) NOT NULL,
    descripcion         TEXT,
    precio              DECIMAL(10,2) NOT NULL,
    id_categoria        INT NOT NULL,
    id_estado_producto  INT NOT NULL,
    id_area             INT NULL,
    FOREIGN KEY (id_categoria) REFERENCES categoria_producto(id_categoria) ON DELETE RESTRICT,
    FOREIGN KEY (id_estado_producto) REFERENCES estado_producto(id_estado_producto) ON DELETE RESTRICT,
    FOREIGN KEY (id_area) REFERENCES area_trabajo(id_area) ON DELETE SET NULL
);

CREATE TABLE inventario (
    id_inventario       INT AUTO_INCREMENT PRIMARY KEY,
    id_producto         INT NOT NULL UNIQUE,
    stock_actual        DECIMAL(10,3) NOT NULL DEFAULT 0,
    stock_minimo        DECIMAL(10,3) NOT NULL DEFAULT 0,
    unidad_medida       VARCHAR(20) NOT NULL DEFAULT 'unidades',
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT
);

CREATE TABLE historial_inventario (
    id_historial        INT AUTO_INCREMENT PRIMARY KEY,
    id_inventario       INT NOT NULL,
    cantidad_anterior   DECIMAL(10,3) NOT NULL,
    cantidad_nueva      DECIMAL(10,3) NOT NULL,
    motivo              VARCHAR(50) NOT NULL, 
    id_venta            INT NULL, 
    id_usuario          INT NOT NULL,
    fecha_movimiento    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_inventario) REFERENCES inventario(id_inventario) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

CREATE TABLE alerta_inventario (
    id_alerta       INT AUTO_INCREMENT PRIMARY KEY,
    id_inventario   INT NOT NULL,
    mensaje         TEXT NOT NULL,
    leida           BOOLEAN DEFAULT FALSE,
    fecha_alerta    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_inventario) REFERENCES inventario(id_inventario) ON DELETE RESTRICT
);

CREATE TABLE pedido (
    id_pedido           INT AUTO_INCREMENT PRIMARY KEY,
    id_mesa             INT NOT NULL,
    id_usuario          INT NOT NULL, 
    fecha_pedido        DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_estado_pedido    INT NOT NULL,
    FOREIGN KEY (id_mesa) REFERENCES mesa(id_mesa) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_estado_pedido) REFERENCES estado_pedido(id_estado_pedido) ON DELETE RESTRICT
);

CREATE TABLE caja (
    id_caja         INT AUTO_INCREMENT PRIMARY KEY,
    fecha_apertura  DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre    DATETIME NULL,
    monto_inicial   DECIMAL(10,2) NOT NULL,
    monto_final     DECIMAL(10,2) NULL,
    estado_caja     VARCHAR(20) NOT NULL DEFAULT 'abierta',
    id_usuario      INT NOT NULL, 
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

CREATE TABLE venta (
    id_venta        INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido       INT NOT NULL UNIQUE, 
    id_caja         INT NOT NULL, 
    fecha_venta     DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_venta     DECIMAL(10,2) NOT NULL,
    id_metodo_pago  INT NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE RESTRICT,
    FOREIGN KEY (id_caja) REFERENCES caja(id_caja) ON DELETE RESTRICT,
    FOREIGN KEY (id_metodo_pago) REFERENCES metodo_pago(id_metodo_pago) ON DELETE RESTRICT
);

ALTER TABLE historial_inventario ADD CONSTRAINT fk_historial_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE SET NULL;

CREATE TABLE comprobante (
    id_comprobante      INT AUTO_INCREMENT PRIMARY KEY,
    id_venta            INT NOT NULL UNIQUE,
    numero_comprobante  VARCHAR(50) NOT NULL UNIQUE,
    fecha_emision       DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_tipo_comprobante INT NOT NULL,
    nombre_cliente      VARCHAR(100) NULL,
    nit_cliente         VARCHAR(30)  NULL,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE RESTRICT,
    FOREIGN KEY (id_tipo_comprobante) REFERENCES tipo_comprobante(id_tipo_comprobante) ON DELETE RESTRICT
);

CREATE TABLE movimiento_caja (
    id_movimiento       INT AUTO_INCREMENT PRIMARY KEY,
    id_caja             INT NOT NULL,
    id_tipo_movimiento  INT NOT NULL,
    id_venta            INT NULL, 
    monto               DECIMAL(10,2) NOT NULL,
    descripcion         TEXT,
    fecha_movimiento    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_caja) REFERENCES caja(id_caja) ON DELETE RESTRICT,
    FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento(id_tipo_movimiento) ON DELETE RESTRICT,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE SET NULL
);

CREATE TABLE receta (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    id_plato INT NOT NULL,
    id_insumo INT NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    CONSTRAINT fk_receta_plato FOREIGN KEY (id_plato) REFERENCES producto(id_producto) ON DELETE RESTRICT,
    CONSTRAINT fk_receta_insumo FOREIGN KEY (id_insumo) REFERENCES inventario(id_inventario) ON DELETE RESTRICT
);