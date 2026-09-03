-- ====================================================================================
-- Person-QRCode MySQL Schema
-- 本文件将项目原本基于 Supabase (PostgreSQL) 的所有表与认证相关结构迁移到 MySQL。
-- 在 MySQL 8.0+ 中测试通过，兼容 5.7+（注意字符集与 collation）。
-- ====================================================================================

-- 创建数据库（可选：如果你的实例已经有数据库，可以注释掉这部分）
-- CREATE DATABASE IF NOT EXISTS person_qrcode
--   DEFAULT CHARACTER SET utf8mb4
--   DEFAULT COLLATE utf8mb4_unicode_ci;
-- USE person_qrcode;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================================================
-- 用户表：users
-- 替代 Supabase 的 auth.users；存储邮箱 + 密码哈希 + 基础用户信息
-- ====================================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id`            CHAR(36)      NOT NULL COMMENT '用户主键 UUID',
  `email`         VARCHAR(255)  NOT NULL COMMENT '用户邮箱（唯一）',
  `password_hash` VARCHAR(255)  NOT NULL COMMENT 'bcrypt 密码哈希',
  `display_name`  VARCHAR(255)  DEFAULT NULL COMMENT '昵称/显示名',
  `email_verified_at` DATETIME  DEFAULT NULL COMMENT '邮箱验证通过时间',
  `credits`       INT           NOT NULL DEFAULT 0 COMMENT '用户积分余额',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='应用用户表（替代 Supabase auth.users）';

-- ====================================================================================
-- 会话表：user_sessions
-- 用于存储已登录用户的会话令牌（替代 Supabase 的 cookie session）
-- ====================================================================================

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id`         CHAR(36)     NOT NULL COMMENT '会话主键 UUID',
  `user_id`    CHAR(36)     NOT NULL COMMENT '关联 users.id',
  `token`      VARCHAR(128) NOT NULL COMMENT '随机生成的会话令牌（写入 HTTP-only Cookie）',
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `ip`         VARCHAR(64)  DEFAULT NULL,
  `expires_at` DATETIME     NOT NULL COMMENT '会话过期时间',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_sessions_token` (`token`),
  KEY `idx_user_sessions_user_id` (`user_id`),
  KEY `idx_user_sessions_expires_at` (`expires_at`),
  CONSTRAINT `fk_user_sessions_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户会话表';

-- ====================================================================================
-- 订阅表：subscriptions
-- 与原 Supabase 订阅表结构一致，仅做语法适配
-- ====================================================================================

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`              CHAR(36)     NOT NULL COMMENT '主键（UUID）',
  `user_id`         CHAR(36)     NOT NULL COMMENT '关联的业务用户 ID（对应 users.id）',
  `product_id`      VARCHAR(128) NOT NULL COMMENT '订阅对应的商品/套餐 ID',
  `plan_type`       VARCHAR(16)  NOT NULL COMMENT '订阅类型：monthly / quarterly / yearly',
  `order_id`        VARCHAR(128) DEFAULT NULL COMMENT '外部订单 ID',
  `subscription_id` VARCHAR(128) DEFAULT NULL COMMENT '外部订阅 ID',
  `start_date`      DATETIME     NOT NULL COMMENT '订阅开始时间',
  `end_date`        DATETIME     NOT NULL COMMENT '订阅结束时间',
  `status`          VARCHAR(32)  NOT NULL DEFAULT 'active' COMMENT '订阅当前状态',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user_id` (`user_id`),
  KEY `idx_subscriptions_user_end_date` (`user_id`, `end_date`),
  KEY `idx_subscriptions_subscription_id` (`subscription_id`),
  CONSTRAINT `fk_subscriptions_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_subscriptions_plan_type`
    CHECK (`plan_type` IN ('monthly', 'quarterly', 'yearly'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户订阅记录表';

-- ====================================================================================
-- 心跳/保活日志表：heartbeat_logs
-- 与原 Supabase heartbeat_logs 表结构一致，仅做语法适配
-- ====================================================================================

CREATE TABLE IF NOT EXISTS `heartbeat_logs` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '日志写入时间',
  `message`    TEXT         NOT NULL COMMENT '日志内容（例如：定时任务心跳信息）',
  PRIMARY KEY (`id`),
  KEY `idx_heartbeat_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='应用保活/心跳日志记录表';

-- ====================================================================================
-- 积分变动记录表：credit_transactions
-- 记录用户积分的每一笔变动（注册赠送、消费、充值等）
-- ====================================================================================

CREATE TABLE IF NOT EXISTS `credit_transactions` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `user_id`     CHAR(36)     NOT NULL COMMENT '关联 users.id',
  `type`        VARCHAR(32)  NOT NULL COMMENT '变动类型：signup_bonus / batch_usage / admin_adjust',
  `amount`      INT          NOT NULL COMMENT '变动积分数量（正数=增加，负数=扣减）',
  `balance_after` INT        NOT NULL COMMENT '变动后积分余额',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述（如"注册赠送500积分"）',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_credit_transactions_user_id` (`user_id`),
  KEY `idx_credit_transactions_type` (`type`),
  KEY `idx_credit_transactions_created_at` (`created_at`),
  CONSTRAINT `fk_credit_transactions_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户积分变动记录表';

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================================
-- 初始数据：可选
--   - 不在此处插入任何用户数据；管理员可以通过注册接口或手动插入。
-- ====================================================================================
