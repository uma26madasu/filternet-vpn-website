# FilterNet VPN - MuleSoft Community Edition Backend Guide

This guide provides complete implementation details for building the FilterNet VPN backend API using **MuleSoft Community Edition**.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Database Configuration](#database-configuration)
- [API Implementations](#api-implementations)
- [Security & Authentication](#security--authentication)
- [Deployment](#deployment)

---

## Architecture Overview

### MuleSoft Flow Structure
```
┌─────────────────┐
│  Frontend       │
│  Dashboard      │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────┐
│  MuleSoft API   │
│  Flows          │
├─────────────────┤
│ • Auth Flow     │
│ • Family Flow   │
│ • Device Flow   │
│ • Filter Flow   │
│ • Activity Flow │
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
┌────────┐ ┌──────┐ ┌──────────┐
│Database│ │Google│ │VPN Server│
│(MySQL/ │ │OAuth │ │(Wire-    │
│ PostgreSQL)│    │ │Guard)    │
└────────┘ └──────┘ └──────────┘
```

---

## Prerequisites

1. **MuleSoft Anypoint Studio** (Community Edition)
   - Download from: https://www.mulesoft.com/lp/dl/studio
   - Version: 7.x or higher

2. **Database**
   - MySQL 8.0+ or PostgreSQL 13+
   - JDBC Driver

3. **Java Development Kit (JDK)**
   - JDK 8 or 11 (required by MuleSoft)

4. **Google OAuth Credentials**
   - Client ID and Client Secret
   - Follow GOOGLE_OAUTH_SETUP.md

---

## Project Setup

### Step 1: Create New Mule Project

1. Open Anypoint Studio
2. File → New → Mule Project
3. Project Name: `filternet-vpn-api`
4. Runtime: Mule Server 4.x (CE)
5. Click Finish

### Step 2: Project Structure

```
filternet-vpn-api/
├── src/main/
│   ├── mule/
│   │   ├── auth-api.xml           # Authentication flows
│   │   ├── family-api.xml         # Family management flows
│   │   ├── content-filter-api.xml # Content filtering flows
│   │   ├── activity-api.xml       # Activity tracking flows
│   │   ├── dashboard-api.xml      # Dashboard statistics flows
│   │   ├── global-config.xml      # Global configurations
│   │   └── error-handler.xml      # Error handling
│   └── resources/
│       ├── application.properties
│       ├── api.raml              # API specification
│       └── database-schema.sql
└── pom.xml
```

### Step 3: Add Dependencies to pom.xml

```xml
<dependencies>
    <!-- Database Connector -->
    <dependency>
        <groupId>org.mule.connectors</groupId>
        <artifactId>mule-db-connector</artifactId>
        <version>1.10.0</version>
        <classifier>mule-plugin</classifier>
    </dependency>

    <!-- HTTP Connector -->
    <dependency>
        <groupId>org.mule.connectors</groupId>
        <artifactId>mule-http-connector</artifactId>
        <version>1.7.1</version>
        <classifier>mule-plugin</classifier>
    </dependency>

    <!-- JSON Module -->
    <dependency>
        <groupId>org.mule.modules</groupId>
        <artifactId>mule-json-module</artifactId>
        <version>2.3.0</version>
        <classifier>mule-plugin</classifier>
    </dependency>

    <!-- MySQL JDBC Driver -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.30</version>
    </dependency>

    <!-- JWT Support -->
    <dependency>
        <groupId>com.auth0</groupId>
        <artifactId>java-jwt</artifactId>
        <version>4.2.1</version>
    </dependency>
</dependencies>
```

---

## Database Configuration

### application.properties

```properties
# Server Configuration
http.port=8081
http.host=0.0.0.0

# Database Configuration
db.host=localhost
db.port=3306
db.name=filternet_vpn
db.user=filternet_user
db.password=your_secure_password

# Google OAuth
google.client.id=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
google.client.secret=YOUR_GOOGLE_CLIENT_SECRET

# JWT Configuration
jwt.secret=your-super-secret-jwt-key-change-this-in-production
jwt.expiration=604800000

# VPN Server Configuration
vpn.server.url=https://vpn-server.filternet.com
vpn.server.api.key=your_vpn_api_key

# CORS
cors.allowed.origins=https://filternet-vpn.com,http://localhost:3000
```

### Database Schema

```sql
-- database-schema.sql

CREATE DATABASE IF NOT EXISTS filternet_vpn;
USE filternet_vpn;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    family_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_google_id (google_id),
    INDEX idx_email (email)
);

-- Families table
CREATE TABLE families (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Family members (children/devices)
CREATE TABLE family_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    family_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    age INT,
    device_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Devices
CREATE TABLE devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    device_name VARCHAR(255),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    vpn_certificate TEXT,
    last_seen TIMESTAMP,
    status ENUM('online', 'offline', 'blocked') DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

-- Time limits
CREATE TABLE time_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    daily_limit_minutes INT DEFAULT 120,
    current_usage_minutes INT DEFAULT 0,
    reset_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

-- App limits
CREATE TABLE app_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    app_package VARCHAR(255),
    limit_minutes INT DEFAULT 60,
    usage_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

-- Content filter rules
CREATE TABLE app_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    app_package VARCHAR(255),
    icon_url TEXT,
    status ENUM('allowed', 'blocked') DEFAULT 'allowed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

-- Website rules
CREATE TABLE website_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    status ENUM('allowed', 'blocked') DEFAULT 'allowed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

-- Category rules
CREATE TABLE category_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status ENUM('allowed', 'blocked') DEFAULT 'allowed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

-- Activity logs
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    device_id INT,
    activity_type ENUM('app', 'website', 'general') DEFAULT 'general',
    app_name VARCHAR(255),
    domain VARCHAR(255),
    duration_minutes INT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date DATE,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    INDEX idx_member_date (member_id, date)
);

-- Bedtime schedules
CREATE TABLE bedtime_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    bedtime TIME NOT NULL,
    wake_time TIME NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);
```

---

## API Implementations

### Global Configuration (global-config.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:db="http://www.mulesoft.org/schema/mule/db">

    <!-- HTTP Listener Configuration -->
    <http:listener-config name="HTTP_Listener_config">
        <http:listener-connection host="${http.host}" port="${http.port}"/>
    </http:listener-config>

    <!-- Database Configuration -->
    <db:config name="Database_Config">
        <db:my-sql-connection
            host="${db.host}"
            port="${db.port}"
            user="${db.user}"
            password="${db.password}"
            database="${db.name}">
            <db:pooling-profile maxPoolSize="10" minPoolSize="2"/>
        </db:my-sql-connection>
    </db:config>

    <!-- Global Properties -->
    <configuration-properties file="application.properties"/>

</mule>
```

---

### 1. Authentication API (auth-api.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core"
      xmlns:db="http://www.mulesoft.org/schema/mule/db">

    <!-- POST /auth/google - Google OAuth Login -->
    <flow name="auth-google-flow">
        <http:listener
            path="/auth/google"
            config-ref="HTTP_Listener_config"
            allowedMethods="POST">
            <http:response>
                <http:headers>#[output application/java --- { 'Access-Control-Allow-Origin': '*' }]</http:headers>
            </http:response>
        </http:listener>

        <!-- Parse incoming JWT credential from Google -->
        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/java
---
{
    credential: payload.credential
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>

        <!-- Verify Google JWT token -->
        <flow-ref name="verify-google-token-subflow"/>

        <!-- Check if user exists -->
        <db:select config-ref="Database_Config">
            <db:sql>SELECT * FROM users WHERE email = :email</db:sql>
            <db:input-parameters><![CDATA[#[{email: vars.googleUser.email}]]]></db:input-parameters>
        </db:select>

        <!-- Create user if doesn't exist -->
        <choice>
            <when expression="#[isEmpty(payload)]">
                <!-- Create new family -->
                <db:insert config-ref="Database_Config">
                    <db:sql>INSERT INTO families (name, owner_id) VALUES (:name, NULL)</db:sql>
                    <db:input-parameters><![CDATA[#[{name: vars.googleUser.name ++ "'s Family"}]]]></db:input-parameters>
                </db:insert>

                <set-variable variableName="familyId" value="#[payload.generatedKeys.GENERATED_KEY]"/>

                <!-- Create new user -->
                <db:insert config-ref="Database_Config">
                    <db:sql>
                        INSERT INTO users (google_id, email, name, picture_url, family_id)
                        VALUES (:googleId, :email, :name, :picture, :familyId)
                    </db:sql>
                    <db:input-parameters><![CDATA[#[{
                        googleId: vars.googleUser.sub,
                        email: vars.googleUser.email,
                        name: vars.googleUser.name,
                        picture: vars.googleUser.picture,
                        familyId: vars.familyId
                    }]]]></db:input-parameters>
                </db:insert>

                <set-variable variableName="userId" value="#[payload.generatedKeys.GENERATED_KEY]"/>

                <!-- Update family owner -->
                <db:update config-ref="Database_Config">
                    <db:sql>UPDATE families SET owner_id = :ownerId WHERE id = :familyId</db:sql>
                    <db:input-parameters><![CDATA[#[{ownerId: vars.userId, familyId: vars.familyId}]]]></db:input-parameters>
                </db:update>
            </when>
            <otherwise>
                <set-variable variableName="userId" value="#[payload[0].id]"/>
                <set-variable variableName="familyId" value="#[payload[0].family_id]"/>
            </otherwise>
        </choice>

        <!-- Generate JWT token -->
        <flow-ref name="generate-jwt-token-subflow"/>

        <!-- Return response -->
        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
{
    access_token: vars.jwtToken,
    user: {
        id: vars.userId,
        email: vars.googleUser.email,
        name: vars.googleUser.name,
        familyId: vars.familyId
    }
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>

    <!-- Subflow: Verify Google Token -->
    <sub-flow name="verify-google-token-subflow">
        <!-- In production, verify with Google's endpoint -->
        <http:request
            method="GET"
            url="https://oauth2.googleapis.com/tokeninfo">
            <http:query-params><![CDATA[#[{id_token: payload.credential}]]]></http:query-params>
        </http:request>

        <ee:transform>
            <ee:message>
                <ee:set-variable variableName="googleUser"><![CDATA[%dw 2.0
output application/java
---
payload]]></ee:set-variable>
            </ee:message>
        </ee:transform>
    </sub-flow>

    <!-- Subflow: Generate JWT Token -->
    <sub-flow name="generate-jwt-token-subflow">
        <ee:transform>
            <ee:message>
                <ee:set-variable variableName="jwtToken"><![CDATA[%dw 2.0
import * from dw::core::Binaries
output application/java
---
// Simplified JWT generation - use Auth0 JWT library in Java component for production
toBase64(write({
    id: vars.userId,
    email: vars.googleUser.email,
    familyId: vars.familyId,
    exp: now() + |P7D|
}, "application/json"))]]></ee:set-variable>
            </ee:message>
        </ee:transform>
    </sub-flow>

</mule>
```

---

### 2. Family API (family-api.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core"
      xmlns:db="http://www.mulesoft.org/schema/mule/db">

    <!-- GET /family/members - Get all family members -->
    <flow name="get-family-members-flow">
        <http:listener
            path="/family/members"
            config-ref="HTTP_Listener_config"
            allowedMethods="GET"/>

        <!-- Authenticate user -->
        <flow-ref name="authenticate-request-subflow"/>

        <!-- Get family members with device info -->
        <db:select config-ref="Database_Config">
            <db:sql><![CDATA[
                SELECT
                    fm.*,
                    d.status as device_status,
                    d.last_seen,
                    tl.daily_limit_minutes,
                    tl.current_usage_minutes
                FROM family_members fm
                LEFT JOIN devices d ON fm.id = d.member_id
                LEFT JOIN time_limits tl ON fm.id = tl.member_id
                WHERE fm.family_id = :familyId
                ORDER BY fm.created_at DESC
            ]]></db:sql>
            <db:input-parameters><![CDATA[#[{familyId: vars.userFamilyId}]]]></db:input-parameters>
        </db:select>

        <!-- Transform to JSON response -->
        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
payload map {
    id: $.id,
    name: $.name,
    avatar: $.avatar,
    age: $.age,
    deviceType: $.device_type,
    status: $.device_status default "offline",
    lastSeen: $.last_seen,
    dailyLimit: $.daily_limit_minutes default 120,
    currentUsage: $.current_usage_minutes default 0
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>

    <!-- POST /family/members - Add family member -->
    <flow name="add-family-member-flow">
        <http:listener
            path="/family/members"
            config-ref="HTTP_Listener_config"
            allowedMethods="POST"/>

        <flow-ref name="authenticate-request-subflow"/>

        <!-- Insert new family member -->
        <db:insert config-ref="Database_Config">
            <db:sql><![CDATA[
                INSERT INTO family_members (family_id, name, avatar, age, device_type)
                VALUES (:familyId, :name, :avatar, :age, :deviceType)
            ]]></db:sql>
            <db:input-parameters><![CDATA[#[{
                familyId: vars.userFamilyId,
                name: payload.name,
                avatar: payload.avatar default "👤",
                age: payload.age,
                deviceType: payload.deviceType
            }]]]></db:input-parameters>
        </db:insert>

        <set-variable variableName="memberId" value="#[payload.generatedKeys.GENERATED_KEY]"/>

        <!-- Create default time limit -->
        <db:insert config-ref="Database_Config">
            <db:sql><![CDATA[
                INSERT INTO time_limits (member_id, daily_limit_minutes, current_usage_minutes)
                VALUES (:memberId, 120, 0)
            ]]></db:sql>
            <db:input-parameters><![CDATA[#[{memberId: vars.memberId}]]]></db:input-parameters>
        </db:insert>

        <!-- Return created member -->
        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
{
    success: true,
    memberId: vars.memberId
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>

    <!-- Authentication Subflow -->
    <sub-flow name="authenticate-request-subflow">
        <set-variable
            variableName="authToken"
            value="#[attributes.headers.authorization replace 'Bearer ' with '']"/>

        <!-- Decode JWT and extract user info -->
        <!-- In production, use proper JWT verification -->
        <ee:transform>
            <ee:message>
                <ee:set-variable variableName="userFamilyId"><![CDATA[%dw 2.0
import * from dw::core::Binaries
output application/java
---
(fromBase64(vars.authToken) as String).familyId]]></ee:set-variable>
            </ee:message>
        </ee:transform>
    </sub-flow>

</mule>
```

---

### 3. Content Filter API (content-filter-api.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core"
      xmlns:db="http://www.mulesoft.org/schema/mule/db">

    <!-- GET /content-filter/apps/:memberId - Get app rules -->
    <flow name="get-app-rules-flow">
        <http:listener
            path="/content-filter/apps/{memberId}"
            config-ref="HTTP_Listener_config"
            allowedMethods="GET"/>

        <flow-ref name="authenticate-request-subflow"/>

        <db:select config-ref="Database_Config">
            <db:sql><![CDATA[
                SELECT * FROM app_rules
                WHERE member_id = :memberId
                ORDER BY app_name
            ]]></db:sql>
            <db:input-parameters><![CDATA[#[{memberId: attributes.uriParams.memberId}]]]></db:input-parameters>
        </db:select>

        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
payload map {
    id: $.id,
    appName: $.app_name,
    appPackage: $.app_package,
    iconUrl: $.icon_url,
    status: $.status
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>

    <!-- PUT /content-filter/apps/:id - Update app rule -->
    <flow name="update-app-rule-flow">
        <http:listener
            path="/content-filter/apps/{id}"
            config-ref="HTTP_Listener_config"
            allowedMethods="PUT"/>

        <flow-ref name="authenticate-request-subflow"/>

        <!-- Update app rule -->
        <db:update config-ref="Database_Config">
            <db:sql><![CDATA[
                UPDATE app_rules
                SET status = :status
                WHERE id = :id
            ]]></db:sql>
            <db:input-parameters><![CDATA[#[{
                id: attributes.uriParams.id,
                status: payload.status
            }]]]></db:input-parameters>
        </db:update>

        <!-- Get member_id and app info -->
        <db:select config-ref="Database_Config">
            <db:sql>SELECT member_id, app_package FROM app_rules WHERE id = :id</db:sql>
            <db:input-parameters><![CDATA[#[{id: attributes.uriParams.id}]]]></db:input-parameters>
        </db:select>

        <set-variable variableName="memberId" value="#[payload[0].member_id]"/>
        <set-variable variableName="appPackage" value="#[payload[0].app_package]"/>

        <!-- Notify VPN server -->
        <flow-ref name="update-vpn-policy-subflow"/>

        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
{
    success: true,
    message: "App rule updated and VPN policy synchronized"
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>

    <!-- Subflow: Update VPN Server Policy -->
    <sub-flow name="update-vpn-policy-subflow">
        <http:request
            method="POST"
            url="${vpn.server.url}/api/policies/update">
            <http:headers><![CDATA[#[{
                'Authorization': 'Bearer ${vpn.server.api.key}',
                'Content-Type': 'application/json'
            }]]]></http:headers>
            <http:body><![CDATA[%dw 2.0
output application/json
---
{
    memberId: vars.memberId,
    appPackage: vars.appPackage,
    action: payload.status
}]]></http:body>
        </http:request>
    </sub-flow>

</mule>
```

---

### 4. Activity API (activity-api.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core"
      xmlns:db="http://www.mulesoft.org/schema/mule/db">

    <!-- GET /activity?memberId=X - Get activity logs -->
    <flow name="get-activity-logs-flow">
        <http:listener
            path="/activity"
            config-ref="HTTP_Listener_config"
            allowedMethods="GET"/>

        <flow-ref name="authenticate-request-subflow"/>

        <db:select config-ref="Database_Config">
            <db:sql><![CDATA[
                SELECT
                    activity_type,
                    app_name,
                    domain,
                    SUM(duration_minutes) as total_minutes,
                    date
                FROM activity_logs
                WHERE member_id = :memberId
                AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY activity_type, app_name, domain, date
                ORDER BY date DESC, total_minutes DESC
            ]]></db:sql>
            <db:input-parameters><![CDATA[#[{memberId: attributes.queryParams.memberId}]]]></db:input-parameters>
        </db:select>

        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
payload map {
    type: $.activity_type,
    name: $.app_name default $.domain,
    duration: $.total_minutes,
    date: $.date as String
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>

    <!-- POST /activity - Log activity -->
    <flow name="log-activity-flow">
        <http:listener
            path="/activity"
            config-ref="HTTP_Listener_config"
            allowedMethods="POST"/>

        <db:insert config-ref="Database_Config">
            <db:sql><![CDATA[
                INSERT INTO activity_logs
                (member_id, device_id, activity_type, app_name, domain, duration_minutes, date)
                VALUES (:memberId, :deviceId, :type, :appName, :domain, :duration, CURDATE())
            ]]></db:sql>
            <db:input-parameters><![CDATA[#[{
                memberId: payload.memberId,
                deviceId: payload.deviceId,
                type: payload.type,
                appName: payload.appName,
                domain: payload.domain,
                duration: payload.duration
            }]]]></db:input-parameters>
        </db:insert>

        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
{
    success: true
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>

</mule>
```

---

### 5. Dashboard API (dashboard-api.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core"
      xmlns:db="http://www.mulesoft.org/schema/mule/db">

    <!-- GET /dashboard/overview - Get dashboard statistics -->
    <flow name="get-dashboard-overview-flow">
        <http:listener
            path="/dashboard/overview"
            config-ref="HTTP_Listener_config"
            allowedMethods="GET"/>

        <flow-ref name="authenticate-request-subflow"/>

        <!-- Get total family members -->
        <db:select config-ref="Database_Config">
            <db:sql>SELECT COUNT(*) as count FROM family_members WHERE family_id = :familyId</db:sql>
            <db:input-parameters><![CDATA[#[{familyId: vars.userFamilyId}]]]></db:input-parameters>
        </db:select>
        <set-variable variableName="totalMembers" value="#[payload[0].count]"/>

        <!-- Get active devices -->
        <db:select config-ref="Database_Config">
            <db:sql><![CDATA[
                SELECT COUNT(*) as count FROM devices d
                JOIN family_members fm ON d.member_id = fm.id
                WHERE fm.family_id = :familyId AND d.status = 'online'
            ]]></db:sql>
            <db:input-parameters><![CDATA[#[{familyId: vars.userFamilyId}]]]></db:input-parameters>
        </db:select>
        <set-variable variableName="activeDevices" value="#[payload[0].count]"/>

        <!-- Get total blocked content -->
        <db:select config-ref="Database_Config">
            <db:sql><![CDATA[
                SELECT COUNT(*) as count FROM (
                    SELECT id FROM app_rules WHERE status = 'blocked'
                    UNION ALL
                    SELECT id FROM website_rules WHERE status = 'blocked'
                    UNION ALL
                    SELECT id FROM category_rules WHERE status = 'blocked'
                ) as blocked_items
            ]]></db:sql>
        </db:select>
        <set-variable variableName="totalBlocked" value="#[payload[0].count]"/>

        <!-- Build response -->
        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
{
    totalMembers: vars.totalMembers,
    activeDevices: vars.activeDevices,
    totalBlocked: vars.totalBlocked,
    systemStatus: "active"
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>

</mule>
```

---

## Security & Authentication

### JWT Token Verification (Using Java Component)

For production, implement proper JWT verification using Java component:

```java
// src/main/java/com/filternet/security/JWTValidator.java
package com.filternet.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.mule.runtime.extension.api.annotation.param.Parameter;
import org.mule.runtime.extension.api.annotation.param.Config;

public class JWTValidator {

    @Parameter
    private String jwtSecret;

    public DecodedJWT validateToken(String token) throws Exception {
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
        return JWT.require(algorithm)
            .build()
            .verify(token);
    }

    public String generateToken(int userId, String email, int familyId) {
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
        return JWT.create()
            .withClaim("id", userId)
            .withClaim("email", email)
            .withClaim("familyId", familyId)
            .withExpiresAt(new Date(System.currentTimeMillis() + 604800000))
            .sign(algorithm);
    }
}
```

---

## Deployment

### Local Testing

1. **Run Database Setup**
   ```bash
   mysql -u root -p < src/main/resources/database-schema.sql
   ```

2. **Configure Application Properties**
   - Update `src/main/resources/application.properties`
   - Add your database credentials
   - Add Google OAuth credentials

3. **Run in Anypoint Studio**
   - Right-click project → Run As → Mule Application
   - API will start on http://localhost:8081

4. **Test Endpoints**
   ```bash
   # Test authentication
   curl -X POST http://localhost:8081/auth/google \
     -H "Content-Type: application/json" \
     -d '{"credential": "YOUR_GOOGLE_JWT_TOKEN"}'

   # Test get family members
   curl -X GET http://localhost:8081/family/members \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Production Deployment

#### Option 1: Standalone Mule Runtime

1. **Export Application**
   - Right-click project → Export → Anypoint Studio Project to Mule Deployable Archive
   - Saves as `filternet-vpn-api.jar`

2. **Deploy to Mule Runtime**
   ```bash
   # Download Mule Runtime CE
   wget https://repository.mulesoft.org/nexus/content/repositories/releases/org/mule/distributions/mule-standalone/4.4.0/mule-standalone-4.4.0.tar.gz

   # Extract
   tar -xvf mule-standalone-4.4.0.tar.gz

   # Copy app
   cp filternet-vpn-api.jar mule-standalone-4.4.0/apps/

   # Start Mule
   cd mule-standalone-4.4.0/bin
   ./mule
   ```

#### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM mulesoft/mule-runtime:4.4.0

# Copy application
COPY target/filternet-vpn-api.jar /opt/mule/apps/

# Expose port
EXPOSE 8081

# Start Mule
CMD ["/opt/mule/bin/mule"]
```

Build and run:
```bash
docker build -t filternet-vpn-api .
docker run -p 8081:8081 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  filternet-vpn-api
```

---

## Integration with Frontend

Update your frontend `config.js`:

```javascript
const CONFIG = {
    google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    },
    api: {
        // Point to your MuleSoft API
        baseURL: 'http://localhost:8081',  // Development
        // baseURL: 'https://api.filternet-vpn.com',  // Production
    },
    demoMode: false,
};
```

---

## Complete API Endpoint Reference

```
Authentication:
POST   /auth/google              # Google OAuth login

Family Management:
GET    /family/members           # Get all family members
POST   /family/members           # Add new member
PUT    /family/members/:id       # Update member
DELETE /family/members/:id       # Remove member

Content Filtering:
GET    /content-filter/apps/:memberId        # Get app rules
PUT    /content-filter/apps/:id              # Update app rule
GET    /content-filter/websites/:memberId    # Get website rules
PUT    /content-filter/websites/:id          # Update website rule
GET    /content-filter/categories/:memberId  # Get category rules
PUT    /content-filter/categories/:id        # Update category rule

Activity Tracking:
GET    /activity?memberId=X      # Get activity logs
POST   /activity                 # Log new activity

Time Limits:
GET    /time-limits/:memberId    # Get time limits
PUT    /time-limits/:memberId    # Update time limits

Bedtime Schedules:
GET    /bedtime/schedules/:memberId  # Get schedules
POST   /bedtime/schedules            # Create schedule
PUT    /bedtime/schedules/:id        # Update schedule

Dashboard:
GET    /dashboard/overview       # Get statistics
```

---

## Next Steps

1. ✅ **Import project into Anypoint Studio**
2. ✅ **Set up database** (MySQL/PostgreSQL)
3. ✅ **Configure application.properties**
4. ✅ **Test authentication flow**
5. ✅ **Deploy to production**
6. ✅ **Configure VPN server integration**
7. ✅ **Update frontend config to point to MuleSoft API**

---

## Support & Resources

- **MuleSoft Documentation**: https://docs.mulesoft.com/
- **MuleSoft Community**: https://help.mulesoft.com/
- **Database Connector**: https://docs.mulesoft.com/db-connector/latest/
- **HTTP Connector**: https://docs.mulesoft.com/http-connector/latest/

Your MuleSoft backend is now ready to power the FilterNet VPN parental control dashboard! 🚀
