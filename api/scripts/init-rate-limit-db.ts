#!/usr/bin/env ts-node

/**
 * SQLite Rate Limiting Database Initialization Script
 *
 * This script initializes the SQLite database for rate limiting.
 * Run this script to set up the database structure and optionally
 * populate it with test data.
 */

import Database from "better-sqlite3";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

const DB_DIR = join(__dirname, "../data");
const DB_PATH = join(DB_DIR, "rate_limits.db");

function initializeDatabase(dbPath: string = DB_PATH) {
    console.log("🚀 Initializing SQLite Rate Limiting Database...");

    // Create data directory if it doesn't exist
    if (!existsSync(DB_DIR)) {
        console.log("📁 Creating data directory...");
        mkdirSync(DB_DIR, { recursive: true });
    }

    // Connect to database
    console.log(`📊 Connecting to database: ${dbPath}`);
    const db = new Database(dbPath);

    try {
        // Create the rate_limits table
        console.log("🏗️  Creating rate_limits table...");
        db.exec(`
            CREATE TABLE IF NOT EXISTS rate_limits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                identifier TEXT NOT NULL,
                action TEXT NOT NULL,
                count INTEGER NOT NULL DEFAULT 1,
                window_start INTEGER NOT NULL,
                window_end INTEGER NOT NULL,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                UNIQUE(identifier, action, window_start)
            );
        `);

        // Create indexes for better performance
        console.log("🔍 Creating performance indexes...");
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
            ON rate_limits(identifier, action, window_end);
        `);

        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end 
            ON rate_limits(window_end);
        `);

        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
            ON rate_limits(window_end, created_at);
        `);

        // Create a view for easier querying
        console.log("👁️  Creating rate_limits_view...");
        db.exec(`
            CREATE VIEW IF NOT EXISTS rate_limits_view AS
            SELECT 
                identifier,
                action,
                SUM(count) as total_count,
                MIN(window_start) as earliest_window,
                MAX(window_end) as latest_window,
                COUNT(*) as active_windows,
                MAX(updated_at) as last_activity
            FROM rate_limits 
            WHERE window_end > strftime('%s', 'now') * 1000
            GROUP BY identifier, action;
        `);

        // Verify the setup
        console.log("✅ Verifying database setup...");

        const tables = db
            .prepare(
                `
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='rate_limits'
        `
            )
            .all();

        const indexes = db
            .prepare(
                `
            SELECT name FROM sqlite_master 
            WHERE type='index' AND tbl_name='rate_limits'
        `
            )
            .all();

        console.log(`📋 Tables created: ${tables.length}`);
        console.log(`🗂️  Indexes created: ${indexes.length}`);

        // Get database info
        const dbInfo = db.prepare("PRAGMA database_list").all();
        const userVersion = db.prepare("PRAGMA user_version").get() as {
            user_version: number;
        };

        console.log("\n📊 Database Information:");
        console.log(`   Database file: ${dbPath}`);
        console.log(`   Size: ${require("fs").statSync(dbPath).size} bytes`);
        console.log(`   User version: ${userVersion.user_version}`);

        // Set user version for future migrations
        if (userVersion.user_version === 0) {
            db.exec("PRAGMA user_version = 1");
            console.log("   User version set to 1");
        }

        console.log("\n✨ Database initialization completed successfully!");
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        throw error;
    } finally {
        db.close();
    }
}

// Add some sample data for testing (optional)
function addSampleData(dbPath: string = DB_PATH) {
    console.log("\n🧪 Adding sample rate limit data for testing...");

    const db = new Database(dbPath);

    try {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        // Sample data
        const sampleData = [
            {
                identifier: "user:test-user-1",
                action: "add-asset",
                count: 3,
                window_start: now - oneHour,
                window_end: now + oneHour,
            },
            {
                identifier: "user:test-user-1",
                action: "global",
                count: 25,
                window_start: now - oneHour,
                window_end: now + oneHour,
            },
            {
                identifier: "ip:192.168.1.100",
                action: "auth",
                count: 2,
                window_start: now,
                window_end: now + 5 * 60 * 1000, // 5 minutes
            },
        ];

        const insertStmt = db.prepare(`
            INSERT INTO rate_limits (identifier, action, count, window_start, window_end)
            VALUES (?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((data: typeof sampleData) => {
            for (const item of data) {
                insertStmt.run(
                    item.identifier,
                    item.action,
                    item.count,
                    item.window_start,
                    item.window_end
                );
            }
        });

        transaction(sampleData);

        console.log(`   Added ${sampleData.length} sample rate limit entries`);

        // Show current data
        const currentData = db.prepare("SELECT * FROM rate_limits_view").all();
        console.log(`   Current active rate limits: ${currentData.length}`);
    } catch (error) {
        console.error("❌ Error adding sample data:", error);
    } finally {
        db.close();
    }
}

// Clean up old data
function cleanupOldData(dbPath: string = DB_PATH) {
    console.log("\n🧹 Cleaning up expired rate limit data...");

    const db = new Database(dbPath);

    try {
        const now = Date.now();

        const deleteStmt = db.prepare(
            "DELETE FROM rate_limits WHERE window_end < ?"
        );
        const result = deleteStmt.run(now);

        console.log(`   Removed ${result.changes} expired entries`);

        // Vacuum the database to reclaim space
        db.exec("VACUUM");
        console.log("   Database vacuumed");
    } catch (error) {
        console.error("❌ Error cleaning up data:", error);
    } finally {
        db.close();
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || "init";
    const dbPath = args[1] || DB_PATH;

    console.log("SQLite Rate Limiting Database Management");
    console.log("=====================================\n");

    switch (command) {
        case "init":
            initializeDatabase(dbPath);
            break;

        case "sample":
            initializeDatabase(dbPath);
            addSampleData(dbPath);
            break;

        case "cleanup":
            cleanupOldData(dbPath);
            break;

        case "reset":
            console.log("🔄 Resetting database...");
            if (existsSync(dbPath)) {
                require("fs").unlinkSync(dbPath);
                console.log("   Old database file removed");
            }
            initializeDatabase(dbPath);
            break;

        default:
            console.log(
                "Usage: ts-node init-rate-limit-db.ts [command] [dbPath]"
            );
            console.log("\nCommands:");
            console.log("  init     - Initialize empty database (default)");
            console.log("  sample   - Initialize with sample data");
            console.log("  cleanup  - Clean up expired entries");
            console.log("  reset    - Delete and recreate database");
            console.log("\nExample:");
            console.log("  ts-node init-rate-limit-db.ts init");
            console.log("  ts-node init-rate-limit-db.ts sample /tmp/test.db");
            process.exit(1);
    }
}

export { initializeDatabase, addSampleData, cleanupOldData };
