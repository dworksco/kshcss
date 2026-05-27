# DataCube JavaScript SDK 빠른 시작

## 5분 안에 시작하기

이 문서는 JavaScript SDK를 처음 사용할 때 가장 자주 쓰는 흐름만 빠르게 정리한 가이드입니다.

대상 파일:

- `datacube-sdk.js`
- `datacube-viewer.js` (`Cesium`과 함께 사용하는 브라우저용 가시화 도구)

요구사항:

- 브라우저 ES5+
- Node.js 18+ 권장

---

## 1. SDK 로드

### 브라우저

```html
<script src="datacube-sdk.js"></script>
<script src="datacube-viewer.js"></script>
<script>
  const client = new DataCubeClient('https://api.example.com', {
      apiKey: 'dcube_...'
  });
</script>
```

### Node.js

```javascript
const { DataCubeClient } = require('./datacube-sdk');

const client = new DataCubeClient('https://api.example.com', {
    apiKey: 'dcube_...'
});
```

---

## 2. 레이어 목록 확인

```javascript
const layers = await client.layers.list();

console.log('레이어 수:', layers.length);
console.log('페이지 정보:', layers.pagination);

layers.forEach(function (layer) {
    console.log(layer.layer_name, layer.layer_type, layer.crs);
});
```

---

## 3. tileset URL 만들기

Cesium 같은 3D 뷰어에서 3D Tiles를 직접 붙일 때 사용합니다.

```javascript
const url = client.tiles.tilesetUrl('building_bit');
console.log(url);
```

timestamp 같은 필터를 query string으로 같이 넣을 수도 있습니다.

```javascript
const filteredUrl = client.tiles.tilesetUrl('building_bit', {
    timestamp: '2026-03-31T00:00:00'
});
```

---

## 4. Viewer로 바로 띄우기

브라우저에서는 `datacube-viewer.js`로 3D Tiles를 바로 로드할 수 있습니다.

```html
<div id="cesiumContainer" style="width:100%;height:500px"></div>
<script src="https://cesium.com/downloads/cesiumjs/releases/1.139/Build/Cesium/Cesium.js"></script>
<script src="datacube-sdk.js"></script>
<script src="datacube-viewer.js"></script>
<script>
  (async function () {
    const client = new DataCubeClient('https://api.example.com', {
      apiKey: 'dcube_...'
    });

    const viewer = client.createViewer('cesiumContainer', {
      terrain: 'vworld',
      imagery: 'vworld'
    });

    await viewer.ready();
    const handle = await viewer.loadTileset('building_bit', { autoZoom: true });
    viewer.setOpacity(handle, 0.85);
  })();
</script>
```

`loadTileset()`은 `tiles.info()`의 `is_json_cube` / `is_point_timeseries` 값을 보고 JSON 큐브를 자동으로 GeoJSON 또는 Point 레이어로 표시합니다. API 결과만 직접 확인하려면 다음처럼 호출합니다.

```javascript
const info = await client.tiles.info('admin_stats_cube');
const geojson = info.is_point_timeseries
    ? await client.tiles.points('admin_stats_cube')
    : await client.tiles.geojson('admin_stats_cube');
const grid = await client.tiles.cubegrid('admin_stats_cube');
console.log(geojson.features.length, grid.tile_count);
```

---

## 5. 공간 쿼리 실행

```javascript
const result = await client.tiles.query('building_bit', {
    bbox: { west: 126.9, south: 37.5, east: 127.0, north: 37.6 },
    height_max: 100,
    format: 'detail',
    limit: 100,
    offset: 0
});

console.log('복셀 수:', result.voxel_count);
console.log('체적:', result.volume_m3);
console.log('페이지:', result.pagination);
```

---

## 6. GLB 또는 Binary 다운로드

### GLB

```javascript
const glbBlob = await client.tiles.exportGlb('building_bit', {
    bbox: { west: 126.9, south: 37.5, east: 127.0, north: 37.6 },
    max_level: 14
});

const glbLink = document.createElement('a');
glbLink.href = URL.createObjectURL(glbBlob);
glbLink.download = 'filtered.glb';
glbLink.click();
```

### Binary

```javascript
const binaryBlob = await client.tiles.exportBinary('building_bit', {
    bbox: { west: 126.9, south: 37.5, east: 127.0, north: 37.6 },
    min_level: 12,
    max_level: 14
});

const binLink = document.createElement('a');
binLink.href = URL.createObjectURL(binaryBlob);
binLink.download = 'filtered_binary.zip';
binLink.click();
```

---

## 7. 업로드 후 create job 생성

### GeoTIFF 예시

```javascript
const upload = await client.data.uploadTif(fileInput.files);

const job = await client.data.createTif('my_raster', upload.tif_files, {
    source_crs: 'EPSG:5186',
    voxel_resolution: 64,
    max_level: 16
});

const status = await client.data.waitJob(job.job_id);
console.log(status);
```

### LAS 예시

```javascript
const upload = await client.data.uploadLas(fileInput.files);

const job = await client.data.createLas('my_lidar', upload.las_file, {
    source_crs: upload.detected_crs
});

const status = await client.data.waitJob(job.job_id);
console.log(status);
```

### Cube 등록 예시

```javascript
const upload = await client.data.uploadCube(fileInput.files);

const job = await client.data.createCube('cube_import', upload.upload_dir, {
    subtree_levels: 3,
    is_public: false
});

const status = await client.data.waitJob(job.job_id);
console.log(status);
```

### NetCDF/GRIB2 예시

단일 U/V 바람 파일 또는 시계열 배치 폴더를 업로드한 뒤 `createNetcdf()`로 job을 제출합니다.

```javascript
const upload = await client.data.uploadNetcdf(fileInput.files);

const job = await client.data.createNetcdf('wind_1000hpa', {
    mode: 'single',
    data_type: 'wind',
    u_file: upload.files[0],
    v_file: upload.files[1],
    max_level: 3,
    voxel_resolution: 64,
    value_type: 'float',
    tile_height: 4000000,
    subtree_levels: 3
});

const status = await client.data.waitJob(job.job_id);
console.log(status);
```

시계열 배치 데이터는 업로드 디렉터리 전체를 넘깁니다.

```javascript
const batchUpload = await client.data.uploadNetcdf(folderInput.files);

const batchJob = await client.data.createNetcdf('wind_timeseries_1000hpa', {
    mode: 'batch',
    input_dir: batchUpload.upload_dir,
    pressure: 1000,
    max_level: 3,
    voxel_resolution: 64
});
```

---

## 8. 비동기 analysis job 사용

analysis job은 두 방식으로 사용할 수 있습니다.

### 제출만 하고 상태는 따로 보기

```javascript
const job = await client.tiles.submitExportGlbAsync('building_bit', {
    bbox: { west: 126.9, south: 37.5, east: 127.0, north: 37.6 },
    max_level: 14
});

console.log(job.job_id);

const status = await client.tiles.jobStatus(job.job_id, {
    include_log: false
});

console.log(status.status, status.progress);
```

### 제출 후 완료까지 기다리기

```javascript
const status = await client.tiles.exportBinaryAsync('building_bit', {
    bbox: { west: 126.9, south: 37.5, east: 127.0, north: 37.6 },
    min_level: 12,
    max_level: 14
}, {
    onSubmitted: function (info) {
        console.log('job_id:', info.job_id);
    },
    onProgress: function (s) {
        console.log((s.progress || 0) + '% - ' + (s.current_step || s.status));
    }
});

console.log(status);
```

### 완료 결과 다운로드

```javascript
const result = await client.tiles.downloadJobResult(jobId);

if (result instanceof Blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(result);
    link.download = 'analysis_result.zip';
    link.click();
} else {
    console.log(result.volume_m3, result.voxel_count);
}
```
