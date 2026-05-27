# DataCube JavaScript SDK 사용자 매뉴얼

## 1. 소개

DataCube JavaScript SDK는 DataCube 서버 API를 브라우저와 Node.js에서 쉽게 호출하기 위한 클라이언트 라이브러리입니다.

이 SDK로 할 수 있는 대표 작업은 다음과 같습니다.

- layer 목록 조회, 상세 조회, 통계 조회
- GLB / LAS / GeoTIFF / Cube 업로드 및 create job 생성
- 3D Tiles URL 생성 및 타일셋 메타 조회
- `datacube-viewer.js`를 통한 Cesium 기반 시각화
- shader/opacity/color/timeseries 재생 제어
- 공간 쿼리, volume 계산, datacube 조회
- voxel 값 수정
- GLB / Binary export
- analysis / create job 상태 조회, 대기, 취소, 삭제, SSE 구독

이 문서는 `datacube-sdk.js`와 `datacube-viewer.js` 기준으로 작성되었습니다.

---

## 2. 설치

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

### 생성자 옵션

```javascript
const client = new DataCubeClient(baseUrl, {
    apiKey: 'dcube_...',
    apiPrefix: '/api',
    timeout: 30000,
    uploadTimeout: 1800000
});
```

| 옵션 | 설명 |
|------|------|
| `apiKey` | API Key. 설정하면 `X-API-Key` 헤더가 자동으로 붙습니다. |
| `apiPrefix` | API prefix. 기본값은 `/api`입니다. |
| `timeout` | 일반 요청 타임아웃(ms). 기본값은 `30000`입니다. |
| `uploadTimeout` | 파일 업로드 타임아웃(ms). 기본값은 `1800000`이며, `0`이면 클라이언트 타임아웃을 사용하지 않습니다. |

---

## 3. 인증

대부분의 API는 API Key가 필요합니다.

```javascript
const client = new DataCubeClient('https://api.example.com', {
    apiKey: 'dcube_...'
});
```

런타임에 키를 바꾸고 싶으면 `setApiKey()`를 사용합니다.

```javascript
client.setApiKey('dcube_new_key');
```

권장사항:

- API Key는 소스코드에 하드코딩하지 않는 편이 좋습니다.
- 운영 환경에서는 HTTPS를 사용하는 것이 좋습니다.

---

## 4. 기본 사용 흐름

SDK 사용 흐름은 보통 다음 중 하나입니다.

### 읽기 중심

1. `layers.list()`로 대상 layer 확인
2. `layers.get()` 또는 `tiles.info()`로 메타 확인
3. `tiles.query()` 또는 `tiles.volume()`으로 분석
4. 필요하면 `tiles.exportGlb()` / `tiles.exportBinary()`로 다운로드

### 데이터 생성 중심

1. `data.upload*()`로 파일 업로드
2. `data.create*()`로 create job 생성
3. `data.jobStatus()` 또는 `data.waitJob()`으로 상태 확인
4. 생성 완료 후 `layers.list()` / `tiles.list()`에서 결과 확인

### 비동기 analysis job 중심

1. `tiles.submitExportGlbAsync()` 같은 submission-only 메서드로 job 제출
2. `tiles.jobStatus()` 또는 `tiles.streamJob()`으로 진행 추적
3. 완료 후 `tiles.downloadJobResult()`로 결과 다운로드

### 브라우저 시각화 중심

1. `client.createViewer()`로 `DataCubeViewer` 생성
2. `viewer.ready()`로 Cesium 준비 완료 대기
3. `viewer.loadTileset()`으로 tileset 로드
4. `viewer.setOpacity()` / `viewer.setColormap()` 등으로 표현 제어
5. 필요하면 `viewer.measure.distance()` / `viewer.measure.area()` 사용

---

## 5. Layer 조회

### 목록 조회

```javascript
const layers = await client.layers.list();

layers.forEach(function (layer) {
    console.log(layer.layer_name, layer.layer_type, layer.crs);
});

console.log(layers.pagination);
```

참고:

- 반환값은 배열입니다.
- `pagination` 정보는 배열 객체의 `pagination` 프로퍼티로 함께 붙습니다.

### 상세 조회

```javascript
const layer = await client.layers.get('seoul-dem');

console.log(layer.layer_name);
console.log(layer.tileset);
console.log(layer.datacube_count);
```

### 통계 조회

```javascript
const stats = await client.layers.stats('seoul-dem');

console.log('datacubes:', stats.datacube_count);
console.log('datablocks:', stats.datablock_count);
console.log('tiles:', stats.tile_count);
```

### 이름 중복 확인

```javascript
const result = await client.layers.checkName('seoul-dem');
console.log(result.exists);
```

### 관리 가능한 layer 목록

```javascript
const manageable = await client.layers.manage();
```

### 이름 변경 / 공개 여부 변경 / 삭제

```javascript
await client.layers.rename('old_name', 'new_name');
await client.layers.setVisibility('new_name', true);
await client.layers.delete('unused_layer');
```

---

## 6. Tiles와 Analysis

### tileset URL 만들기

Cesium 같은 3D 뷰어에 타일셋을 직접 붙일 때 사용합니다.

```javascript
const url = client.tiles.tilesetUrl('seoul-dem');
console.log(url);
```

필요하면 query string 필터를 같이 넣을 수 있습니다.

```javascript
const filteredUrl = client.tiles.tilesetUrl('seoul-dem', {
    timestamp: '2026-03-31T00:00:00'
});
```

### Viewer 생성과 tileset 로드

```javascript
const viewer = client.createViewer('cesiumContainer', {
    terrain: 'vworld',
    imagery: 'vworld',
    camera: { longitude: 127.0, latitude: 37.5, height: 50000 }
});

await viewer.ready();

const handle = await viewer.loadTileset('seoul-dem', {
    autoZoom: true,
    opacity: 0.9
});
```

### Viewer 표현 제어

```javascript
viewer.setOpacity(handle, 0.7);
viewer.setColormap(handle, 'jet');
viewer.setHeightOffset(handle, 10);
```

timeseries 데이터가 있으면:

```javascript
viewer.play(handle, { speed: 1.0 });
viewer.pause(handle);
```

### 측정 / 영역 선택

```javascript
const dist = await viewer.measure.distance();
const area = await viewer.measure.area();
const bbox = await viewer.selectArea();
viewer.clearArea();
```

### tileset 메타 조회

```javascript
const info = await client.tiles.info('seoul-dem');

console.log(info.name);
console.log(info.block_count);
console.log(info.timestamps);
```

JSON 큐브는 `info.is_json_cube`로 구분합니다. 행정구역/통계 JSON 큐브는 GeoJSON으로, 좌표 시계열 JSON 큐브는 Point FeatureCollection으로 조회할 수 있습니다.

```javascript
const info = await client.tiles.info('admin_stats_cube');

if (info.is_point_timeseries) {
    const points = await client.tiles.points('admin_stats_cube');
    console.log(points.fields, points.time_range, points.features.length);
} else if (info.is_json_cube) {
    const geojson = await client.tiles.geojson('admin_stats_cube');
    const grid = await client.tiles.cubegrid('admin_stats_cube');
    console.log(geojson.features.length, grid.tile_count);
}
```

### volume 계산

```javascript
const volume = await client.tiles.volume(
    'seoul-dem',
    126.9,
    37.45,
    127.1,
    37.65
);

console.log(volume.volume_m3, volume.voxel_count);
```

### bbox 기반 query

```javascript
const summary = await client.tiles.query('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 }
});

console.log(summary.datacube_count);
```

상세 모드에서는 voxel 수, volume, 페이지 정보가 같이 옵니다.

```javascript
const detail = await client.tiles.query('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 },
    height_min: 0,
    height_max: 120,
    value_op: 'range',
    value1: 10,
    value2: 100,
    format: 'detail',
    limit: 100,
    offset: 0
});

console.log(detail.voxel_count);
console.log(detail.volume_m3);
console.log(detail.pagination);
console.log(detail.datacubes);
```

### datacube 데이터 조회

raw 모드:

```javascript
const raw = await client.tiles.datacube('11_1_12_2048_1024_0', {
    format: 'raw',
    include_data: true
});

console.log(raw.byte_length);
console.log(raw.datablock_base64);
```

voxels 모드:

```javascript
const voxels = await client.tiles.datacube('11_1_12_2048_1024_0', {
    format: 'voxels',
    offset: 0,
    limit: 1000
});

console.log(voxels.voxels);
console.log(voxels.has_more);
```

### 지오메트리 기반 query

```javascript
const result = await client.tiles.queryByGeometry('seoul-dem', {
    type: 'box3d',
    west: 126.9,
    south: 37.45,
    east: 127.1,
    north: 37.65,
    height_min: 0,
    height_max: 120
}, {
    format: 'detail',
    limit: 200
});
```

지원 geometry 타입:

- `point`
- `line`
- `polygon`
- `circle`
- `box3d`

---

## 7. 파일 다운로드

### GLB export

```javascript
const blob = await client.tiles.exportGlb('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 },
    max_level: 12
});

const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'filtered.glb';
a.click();
```

참고:

- 결과가 1개면 `.glb`, 여러 개면 `.zip`일 수 있습니다.

### Binary export

```javascript
const blob = await client.tiles.exportBinary('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 },
    min_level: 10,
    max_level: 12
});

const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'filtered_binary.zip';
a.click();
```

---

## 8. 데이터 업로드와 Create

create 작업은 보통 `업로드 -> create job 생성 -> 상태 확인` 순서로 진행합니다.

## 8.1 GLB

```javascript
const upload = await client.data.uploadGlb(fileInput.files);

const job = await client.data.createGlb('building-bit', upload.upload_dir, {
    source_crs: 'EPSG:4326',
    voxel_resolution: 64,
    max_level: 16,
    subtree_levels: 3,
    terrain: '/srv/dem/terrain.tif',
    is_public: false
});

const status = await client.data.waitJob(job.job_id);
console.log(status);
```

## 8.2 LAS

```javascript
const upload = await client.data.uploadLas(fileInput.files);

const job = await client.data.createLas('seoul-lidar', upload.las_file, {
    source_crs: upload.detected_crs,
    voxel_resolution: 64,
    max_level: 14
});

const status = await client.data.waitJob(job.job_id);
console.log(status);
```

## 8.3 GeoTIFF

GeoTIFF는 `input_file`, `input_dir`, `input_files` 세 방식 중 하나를 사용할 수 있습니다.

```javascript
const upload = await client.data.uploadTif(fileInput.files);

const job = await client.data.createTif('terrain-2026', upload.tif_files, {
    source_crs: 'EPSG:5186',
    voxel_resolution: 64,
    max_level: 12
});

const status = await client.data.waitJob(job.job_id);
console.log(status);
```

### 참고

- `createTif(name, upload.upload_dir, opts)`처럼 `input_dir` 형태로도 호출할 수 있습니다.
- `createTif(name, upload.tif_file, opts)`처럼 단일 파일로도 호출할 수 있습니다.

## 8.4 Cube 결과 등록

`createCube()`는 이미 준비된 cube 결과를 DB에 등록하는 용도입니다.

```javascript
const upload = await client.data.uploadCube(fileInput.files);

const job = await client.data.createCube('cube-import', upload.upload_dir, {
    subtree_levels: 3,
    is_public: false
});

const status = await client.data.waitJob(job.job_id);
console.log(status);
```

## 8.5 NetCDF/GRIB2

`uploadNetcdf()`는 `.gb2`, `.grib2`, `.grb`, `.nc`, `.nc4`, `.cdf`, `.zip`을 업로드합니다. 폴더 선택을 사용하면 브라우저의 `webkitRelativePath`를 이용해 상대 경로가 유지됩니다.

### 단일 U/V 바람 데이터

```javascript
const upload = await client.data.uploadNetcdf(fileInput.files);

const job = await client.data.createNetcdf('wind-1000hpa', {
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

### 단일 스칼라 데이터

```javascript
const upload = await client.data.uploadNetcdf(fileInput.files);

const job = await client.data.createNetcdf('scalar-1000hpa', {
    mode: 'single',
    data_type: 'scalar',
    input_file: upload.files[0],
    data_height: 1000,
    max_level: 3,
    voxel_resolution: 64
});
```

### 시계열 배치 데이터

```javascript
const upload = await client.data.uploadNetcdf(folderInput.files);

const job = await client.data.createNetcdf('wind-timeseries-1000hpa', {
    mode: 'batch',
    input_dir: upload.upload_dir,
    pressure: 1000,
    max_level: 3,
    voxel_resolution: 64,
    value_type: 'float'
});
```

batch 모드로 생성된 시계열 레이어는 viewer가 `atlas` 메타데이터를 감지하면 자동으로 atlas shader로 로드합니다.

```javascript
const viewer = client.createViewer('cesiumContainer');
await viewer.ready();

const handle = await viewer.loadTileset('wind-timeseries-1000hpa', {
    autoZoom: true
});

console.log(viewer.getTimeseries(handle));
viewer.play(handle, { speed: 1.0 });
```

### create 옵션 정리

`createGlb` / `createLas` / `createTif` / `createNetcdf`에서 쓸 수 있는 주요 옵션:

| 옵션 | 설명 |
|------|------|
| `source_crs` | 원본 좌표계 |
| `crs` | `source_crs` 별칭 |
| `min_level` | 최소 레벨 |
| `max_level` | 최대 레벨 |
| `voxel_resolution` | `64` 또는 `128` |
| `subtree_levels` | subtree depth |
| `cube_data_type` | 예약 옵션 |
| `cube_format` | 예약 옵션 |
| `terrain` | DEM 파일 경로 또는 지형 보정 입력값 |
| `rotate_x_axis` | X축 회전 여부 |
| `is_public` | 공개 여부 |

NetCDF 전용 옵션:

| 옵션 | 설명 |
|------|------|
| `mode` | `single` 또는 `batch` |
| `data_type` | 단일 모드에서 `wind` 또는 `scalar` |
| `u_file`, `v_file` | 단일 wind 모드 U/V 파일 경로 |
| `input_file` | 단일 scalar 모드 파일 경로 |
| `input_dir` | batch 모드 업로드 디렉터리 |
| `pressure` | batch 모드 대상 기압(hPa) |
| `data_height` | 단일 모드 데이터 높이(m) |
| `value_type` | 저장 값 유형 |

`createCube`에서 쓸 수 있는 옵션:

| 옵션 | 설명 |
|------|------|
| `subtree_levels` | subtree depth |
| `is_public` | 공개 여부 |

---

## 9. Job 상태 확인

### create job 상태 조회

```javascript
const status = await client.data.jobStatus(jobId, { include_log: true });
console.log(status.status, status.progress, status.current_step);
console.log(status.log);
```

### create job 목록 조회

```javascript
const jobs = await client.data.listJobs('PROCESSING', 100);
```

### create job 취소 / 삭제

```javascript
await client.data.cancelJob(jobId);
await client.data.deleteJob(jobId);
```

### create job SSE 구독

```javascript
const stream = client.data.streamJob(jobId, {
    status: function (payload) {
        console.log('status', payload);
    },
    log: function (payload) {
        console.log('log', payload);
    },
    complete: function (payload) {
        console.log('done', payload);
    }
});

await stream.done;
```

---

## 10. Analysis Job 사용법

analysis 비동기 메서드는 두 종류가 있습니다.

### 1. 제출만 하는 메서드

- `submitExportGlbAsync()`
- `submitExportBinaryAsync()`

이 메서드들은 job을 등록하고 바로 `job_id`를 반환합니다.

```javascript
const job = await client.tiles.submitExportGlbAsync('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 },
    max_level: 12
});

console.log(job.job_id);

const status = await client.tiles.jobStatus(job.job_id, {
    include_log: false
});
```

### 2. 제출 후 완료까지 기다리는 메서드

- `exportGlbAsync()`
- `exportBinaryAsync()`
- `volumeAsync()`
- `bulkUpdateVoxelAsync()`
- `updateByGeometryAsync()`

이 메서드들은 내부적으로 job을 제출한 뒤 `waitJob()`까지 수행합니다.

```javascript
const status = await client.tiles.exportBinaryAsync('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 },
    min_level: 10,
    max_level: 12
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

### analysis job 상태 조회 / 취소 / 삭제

```javascript
const status = await client.tiles.jobStatus(jobId, { include_log: true });
await client.tiles.cancelJob(jobId);
await client.tiles.deleteJob(jobId);
```

### analysis job SSE 구독

```javascript
const stream = client.tiles.streamJob(jobId, {
    status: function (payload) { console.log(payload); },
    log: function (payload) { console.log(payload); },
    complete: function (payload) { console.log(payload); }
});

await stream.done;
```

### 완료 결과 다운로드

`downloadJobResult()`는 job 종류에 따라 반환 타입이 달라집니다.

```javascript
const result = await client.tiles.downloadJobResult(jobId);
```

- volume job이면 JSON 객체 반환
- export job이면 `Blob` 반환

예:

```javascript
if (result instanceof Blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(result);
    a.download = 'analysis_result.zip';
    a.click();
} else {
    console.log(result.volume_m3, result.voxel_count);
}
```

---

## 11. Voxel 편집

### 단일 voxel 수정

```javascript
await client.tiles.updateVoxel('seoul-dem', {
    level: 12,
    col: 2048,
    row: 1024,
    floor: 0,
    vx: 32,
    vy: 14,
    vz: 18,
    value: 7,
    block_index: 0
});
```

### 일괄 수정

```javascript
const preview = await client.tiles.bulkUpdateVoxel('seoul-dem', {
    level: 12,
    col: '*',
    row: '*',
    floor: 0,
    vx: '*',
    vy: '*',
    vz: 0,
    value: 1,
    dry_run: true
});

console.log(preview);
```

### geometry 기반 수정

```javascript
await client.tiles.updateByGeometry('seoul-dem', {
    type: 'box3d',
    west: 126.9,
    south: 37.45,
    east: 127.1,
    north: 37.65,
    height_min: 0,
    height_max: 120
}, 99, {
    include_empty: false,
    limit: 200
});
```

---

## 12. 오류 처리

SDK는 HTTP 오류 시 `Error`를 throw합니다.

```javascript
try {
    await client.layers.get('nonexistent');
} catch (err) {
    console.error('status:', err.status);
    console.error('message:', err.message);
    console.error('response:', err.response);
}
```

일반적인 서버 오류 응답 형식:

```json
{
  "status": "error",
  "error": {
    "code": "MISSING_FIELDS",
    "message": "tileset_name is required"
  }
}
```

---

## 13. 정리

처음 사용할 때는 아래 순서로 익히는 것이 가장 편합니다.

1. `layers.list()` / `layers.get()`으로 데이터 확인
2. `tiles.query()` / `tiles.volume()`으로 읽기 API 사용
3. `data.upload*()` + `data.create*()` + `data.waitJob()`으로 create 흐름 익히기
4. `tiles.exportGlb()` / `tiles.exportBinary()`로 결과 다운로드
5. `submitExport*Async()` / `streamJob()` / `downloadJobResult()`로 비동기 job 흐름 익히기

세부 함수 시그니처와 반환 필드가 필요하면 API_Reference.md를 같이 참고하면 됩니다.

homepage-setup 서버 기능 검증은 `example.html`을 열어 진행하는 것을 기준으로 합니다. 권장 순서는 layer list 확인, 업로드, create job 제출, job wait/status/log 확인, tiles list 또는 layer stats 확인입니다. Organization API와 smoke test 전용 흐름은 이 예제에 포함하지 않습니다.
