#!/usr/bin/env node
/**
 * Service launcher - starts three services as detached processes
 */
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

const repoRoot = 'c:\\Users\\kkagiri\\Sources\\Repo\\TenacityFMS';
const adminDir = path.join(repoRoot, 'apps', 'FMS.Admin');

function startDetachedService(name, command, args, cwd) {
    try {
        const child = spawn(command, args, {
            cwd: cwd,
            detached: true,
            stdio: 'ignore',
            windowsHide: true
        });
        
        // Unref the child process so it doesn't keep parent alive
        child.unref();
        
        console.log(`✓ Started ${name} (PID: ${child.pid})`);
        return child.pid;
    } catch (err) {
        console.error(`✗ Failed to start ${name}: ${err.message}`);
        return null;
    }
}

async function ensureNodeModules() {
    const nodeModulesPath = path.join(adminDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        console.log('Installing npm dependencies for FMS.Admin...');
        return new Promise((resolve) => {
            const npm = spawn('npm', ['install'], {
                cwd: adminDir,
                stdio: 'inherit'
            });
            npm.on('close', (code) => {
                if (code === 0) {
                    console.log('✓ npm install completed');
                    resolve(true);
                } else {
                    console.error('✗ npm install failed');
                    resolve(false);
                }
            });
        });
    }
    console.log('✓ node_modules already exists for FMS.Admin');
    return true;
}

async function main() {
    console.log('Starting TenacityFMS services...\n');
    
    const pids = [];
    
    // Start FMS.WebClient
    const pid1 = startDetachedService(
        'FMS.WebClient',
        'dotnet',
        ['run', '--project', 'apps/FMS.WebClient/FMS.WebClient.csproj'],
        repoRoot
    );
    if (pid1) pids.push({ service: 'FMS.WebClient', pid: pid1 });
    
    // Start FMS.Sales.Api
    const pid2 = startDetachedService(
        'FMS.Sales.Api',
        'dotnet',
        ['run', '--project', 'FMS.Sales/FMS.Sales.Api/FMS.Sales.Api.csproj'],
        repoRoot
    );
    if (pid2) pids.push({ service: 'FMS.Sales.Api', pid: pid2 });
    
    // Ensure node_modules for FMS.Admin
    const hasModules = await ensureNodeModules();
    
    if (hasModules) {
        // Start FMS.Admin
        const pid3 = startDetachedService(
            'FMS.Admin',
            'npm',
            ['run', 'dev'],
            adminDir
        );
        if (pid3) pids.push({ service: 'FMS.Admin', pid: pid3 });
    }
    
    console.log('\n=== Services Started ===');
    pids.forEach(({service, pid}) => {
        console.log(`${service}: ${pid}`);
    });
    
    console.log('\n✓ All services are running in detached mode and will persist after this process ends.');
}

main().catch(console.error);
