#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LAMBDA_PACKAGE_DIR = 'lambda-package';
const DIST_DIR = 'dist';

function log(message) {
    console.log(`[Lambda Prep] ${message}`);
}

function cleanDirectory(dir) {
    if (fs.existsSync(dir)) {
        log(`Limpiando directorio ${dir}...`);
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copyDirectory(src, dest) {
    log(`Copiando ${src} -> ${dest}...`);
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src, { withFileTypes: true });
    
    for (const item of items) {
        const srcPath = path.join(src, item.name);
        const destPath = path.join(dest, item.name);
        
        if (item.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function createLambdaPackageJson() {
    log('Creando package.json para Lambda...');
    
    // Leer el package.json principal
    const mainPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Crear package.json simplificado para Lambda
    const lambdaPackageJson = {
        name: `${mainPackageJson.name}-lambda`,
        version: mainPackageJson.version,
        main: 'lambda.js',
        dependencies: mainPackageJson.dependencies || {}
    };
    
    fs.writeFileSync(
        path.join(LAMBDA_PACKAGE_DIR, 'package.json'),
        JSON.stringify(lambdaPackageJson, null, 2)
    );
}

function installDependencies() {
    log('Instalando dependencias de producción...');
    const originalCwd = process.cwd();
    
    try {
        process.chdir(LAMBDA_PACKAGE_DIR);
        execSync('npm install --only=production --silent', { stdio: 'inherit' });
    } finally {
        process.chdir(originalCwd);
    }
}

function copyAssets() {
    log('Copiando archivos adicionales...');
    
    // Copiar WorkingDays.json
    if (fs.existsSync('WorkingDays.json')) {
        fs.copyFileSync('WorkingDays.json', path.join(LAMBDA_PACKAGE_DIR, 'WorkingDays.json'));
    }
    
    // Agregar otros archivos que necesite Lambda aquí
}

function main() {
    try {
        log('Iniciando preparación del paquete Lambda...');
        
        // Verificar que dist existe
        if (!fs.existsSync(DIST_DIR)) {
            throw new Error(`Directorio ${DIST_DIR} no encontrado. Ejecuta 'npm run build' primero.`);
        }
        
        // Limpiar directorio anterior
        cleanDirectory(LAMBDA_PACKAGE_DIR);
        
        // Crear directorio
        fs.mkdirSync(LAMBDA_PACKAGE_DIR, { recursive: true });
        
        // Copiar código compilado
        copyDirectory(DIST_DIR, LAMBDA_PACKAGE_DIR);
        
        // Crear package.json
        createLambdaPackageJson();
        
        // Instalar dependencias
        installDependencies();
        
        // Copiar assets adicionales
        copyAssets();
        
        log('✅ Paquete Lambda preparado exitosamente!');
        
    } catch (error) {
        console.error(`❌ Error preparando paquete Lambda: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
