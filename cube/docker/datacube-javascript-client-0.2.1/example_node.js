#!/usr/bin/env node
/**
 * DataCube JavaScript SDK - Node.js Usage Examples
 *
 * Run:
 *   node example_node.js
 *
 * Requirement:
 *   Node.js 18+ (fetch / Blob support)
 */

const fs = require('fs');
const { DataCubeClient } = require('./datacube-sdk');

const SERVER_URL = 'http://localhost:5003';
const API_KEY = 'dcube_f3ec12644379098c506ca83c5d511897';
const SAMPLE_LAYER = 'building_bit';
const SAMPLE_BBOX = {
    west: 126.96,
    south: 37.56,
    east: 126.9995,
    north: 37.595
};

function printSection(title) {
    console.log('\n=== ' + title + ' ===');
}

async function saveBlobToFile(blob, filePath) {
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log('Saved:', filePath, '(' + (buffer.length / 1024).toFixed(1) + ' KB)');
}

async function main() {
    console.log('DataCube JavaScript SDK - Node.js Examples');

    const client = new DataCubeClient(SERVER_URL, {
        apiKey: API_KEY,
        timeout: 120000
    });

    printSection('1. Client');
    console.log('Server:', SERVER_URL);
    console.log('API key:', API_KEY.slice(0, 15) + '...');

    printSection('2. List Layers');
    const layers = await client.layers.list(1, 20);
    console.log('Layer count in this page:', layers.length);
    console.log('Pagination:', layers.pagination || null);
    layers.forEach(function (layer) {
        console.log('-', layer.layer_name, '(' + layer.layer_type + ')');
    });

    if (layers.length > 0) {
        const firstLayer = layers[0].layer_name;

        printSection('3. Layer Detail / Stats');
        const detail = await client.layers.get(firstLayer);
        console.log('Detail:', JSON.stringify(detail, null, 2));
        try {
            const stats = await client.layers.stats(firstLayer);
            console.log('Stats:', JSON.stringify(stats, null, 2));
        } catch (err) {
            console.log('Stats error:', err.message);
        }

        printSection('4. Tileset URL');
        console.log(client.tiles.tilesetUrl(firstLayer));
    }

    printSection('5. Spatial Query');
    try {
        const queryResult = await client.tiles.query(SAMPLE_LAYER, {
            bbox: SAMPLE_BBOX,
            format: 'detail',
            limit: 10,
            offset: 0
        });
        console.log(JSON.stringify(queryResult, null, 2));
    } catch (err) {
        console.log('Query error:', err.message);
    }

    printSection('6. Direct Export');
    try {
        const glbBlob = await client.tiles.exportGlb(SAMPLE_LAYER, {
            bbox: SAMPLE_BBOX,
            max_level: 14
        });
        await saveBlobToFile(glbBlob, 'building_bit_export_glb.zip');

        const binaryBlob = await client.tiles.exportBinary(SAMPLE_LAYER, {
            bbox: SAMPLE_BBOX,
            min_level: 12,
            max_level: 14
        });
        await saveBlobToFile(binaryBlob, 'building_bit_export_binary.zip');
    } catch (err) {
        console.log('Direct export error:', err.message);
    }

    printSection('7. Async Export Submit / Status / Download');
    try {
        const job = await client.tiles.submitExportGlbAsync(SAMPLE_LAYER, {
            bbox: SAMPLE_BBOX,
            max_level: 14
        });
        console.log('Submitted job:', JSON.stringify(job, null, 2));

        const status = await client.tiles.waitJob(job.job_id, {
            pollInterval: 2000,
            timeout: 600000,
            onProgress: function (s) {
                console.log('Progress:', s.status, s.progress + '%', s.current_step || '');
            }
        });
        console.log('Final status:', JSON.stringify(status, null, 2));

        const result = await client.tiles.downloadJobResult(job.job_id);
        if (typeof Blob !== 'undefined' && result instanceof Blob) {
            await saveBlobToFile(result, 'building_bit_async_export_glb.zip');
        } else {
            console.log('Download result is JSON:', JSON.stringify(result, null, 2));
        }
    } catch (err) {
        console.log('Async export error:', err.message);
    }

    printSection('8. Create Datacube');
    console.log('Browser example.html is the primary server test UI. This Node sample keeps compact API snippets only.');
    console.log('');
    console.log('// GLB create job');
    console.log("// const createGlbJob = await client.data.createGlb('sample_glb', '/upload/glb/sample_dir', {");
    console.log("//     source_crs: 'EPSG:5186',");
    console.log("//     voxel_resolution: 64,");
    console.log("//     max_level: 14,");
    console.log("//     subtree_levels: 3,");
    console.log("//     tile_height: 4000000,");
    console.log("//     workers: 4,");
    console.log("//     is_public: true");
    console.log('// });');
    console.log('');
    console.log('// SHP upload -> create');
    console.log("// const shpUpload = await client.data.uploadShp(['./sample.shp', './sample.shx', './sample.dbf', './sample.prj']);");
    console.log("// const createShpJob = await client.data.createShp('sample_shp', shpUpload.shp_files, {");
    console.log("//     source_crs: 'EPSG:5186',");
    console.log("//     height_field: 'height',");
    console.log("//     attribute_field: 'code'");
    console.log('// });');
    console.log('');
    console.log('// Stats/Admin/Point creators');
    console.log("// const statsUpload = await client.data.uploadJson('./stats.csv');");
    console.log("// const statsJob = await client.data.createStats('sample_stats', 'admin_layer', statsUpload.filepath, { join_key: 'adm_cd' });");
    console.log("// const adminJob = await client.data.createAdmin('sample_admin', '/upload/json/admin.geojson', { theme: 'admin' });");
    console.log("// const pointJob = await client.data.createPoint('sample_point', '/upload/json/points.csv', { z_field: 'height' });");
    console.log('');
    console.log('// 기존 voxelizer API는 명시적인 메서드명으로 제공합니다');
    console.log("// const legacyGlbJob = await client.data.createVoxelizerGlb('sample_legacy_glb', '/upload/glb/sample_dir', { max_level: 14 });");
    console.log("// const legacyLasJob = await client.data.createVoxelizerLas('sample_legacy_las', '/upload/las/sample.las', { source_crs: 'EPSG:5186' });");
    console.log("// const legacyTifJob = await client.data.createVoxelizerTif('sample_legacy_tif', { input_dir: '/upload/tif/sample_dir' }, { source_crs: 'EPSG:5186' });");
    console.log('');
    console.log('// Cube registration');
    console.log("// const createCubeJob = await client.data.createCube('sample_cube', '/upload/cube/sample_dir', { subtree_levels: 3, is_public: true });");
    console.log('');
    console.log('// Layer merge');
    console.log("// const validation = await client.layers.validateMerge(['layer_a', 'layer_b']);");
    console.log("// const mergeJob = await client.layers.merge('merged_layer', ['layer_a', 'layer_b'], { tile_level: 14 });");
    console.log('');
    console.log('// const createStatus = await client.data.waitJob(createGlbJob.job_id);');
    console.log("// console.log('Create status:', createStatus.status);");
}

main().catch(function (err) {
    console.error(err);
    process.exitCode = 1;
});
