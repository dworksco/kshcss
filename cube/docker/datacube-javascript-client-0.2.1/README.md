# DataCube JavaScript SDK

DataCube JavaScript SDK는 DataCube 서버 API를 브라우저와 Node.js에서 쉽게 호출하기 위한 경량 SDK이며, 브라우저에서는 3D Tiles 가시화용 viewer도 함께 사용할 수 있습니다.

기준 구현:

- `datacube-sdk.js`
- `datacube-viewer.js`

주요 기능:

- layer 조회 / 관리
- 파일 업로드와 create job 생성
- 3D Tiles URL 생성
- Cesium 기반 tileset 시각화
- colormap / opacity / height offset 제어
- timeseries 재생, 거리/면적 측정, 영역 선택
- 공간 쿼리 / volume 계산 / datacube 조회
- voxel 수정
- GLB / Binary export
- create / analysis job 상태 조회, 대기, SSE 구독
- SHP/DEM/stats 업로드, JSON 큐브 생성, 기존 voxelizer, layer merge

최소 지원 버전:

- 브라우저: ES5+
- Node.js: 18+ 권장

참고:

- Browser/Node 모두 Promise 기반 비동기 호출을 사용합니다.
- Binary download 계열 기능은 `fetch`와 `Blob`을 지원하는 환경이 가장 안전합니다.
- homepage-setup 서버 기능 테스트의 대표 예제는 `example.html`입니다. `example_node.js`는 보조 API 호출 샘플입니다.

---

## 설치

현재 `javascript/` 디렉토리를 기준으로 설명합니다.

### 브라우저

```html
<script src="http://your-server:5003/static/js/datacube-sdk.js"></script>
<script src="http://your-server:5003/static/js/datacube-viewer.js"></script>
<script>
  const client = new DataCubeClient('http://your-server:5003', {
      apiKey: 'dcube_...'
  });
</script>
```

### Node.js

로컬 파일을 직접 불러오는 방식:

```javascript
const { DataCubeClient } = require('./datacube-sdk');

const client = new DataCubeClient('http://your-server:5003', {
    apiKey: 'dcube_...'
});
```

서버에서 SDK를 받아 동적으로 로드하는 방식:

```javascript
const SERVER_URL = 'http://your-server:5003';

async function loadSDK() {
    const resp = await fetch(SERVER_URL + '/static/js/datacube-sdk.js');
    const code = await resp.text();
    const moduleLike = { exports: {} };
    new Function('module', 'exports', code)(moduleLike, moduleLike.exports);
    return moduleLike.exports;
}

const { DataCubeClient } = await loadSDK();
```

---

## 빠른 예제

```javascript
const client = new DataCubeClient('http://your-server:5003', {
    apiKey: 'dcube_...'
});

// 1. layer 목록 조회
const layers = await client.layers.list();
console.log(layers.length, layers.pagination);

// 2. 공간 쿼리
const query = await client.tiles.query('building_bit', {
    bbox: { west: 126.9, south: 37.5, east: 127.0, north: 37.6 },
    format: 'detail',
    limit: 100,
    offset: 0
});
console.log(query.voxel_count, query.volume_m3);

// 3. GLB 다운로드
const blob = await client.tiles.exportGlb('building_bit', {
    bbox: { west: 126.9, south: 37.5, east: 127.0, north: 37.6 },
    max_level: 14
});
console.log(blob.size);

// 4. GeoTIFF 업로드 + create job
const upload = await client.data.uploadTif(fileInput.files);
const createJob = await client.data.createTif('my_raster', upload.tif_files, {
    source_crs: 'EPSG:5186',
    voxel_resolution: 64,
    max_level: 16
});
const createStatus = await client.data.waitJob(createJob.job_id);
console.log(createStatus.status);
```

### 브라우저 가시화 예제

```html
<script src="https://cesium.com/downloads/cesiumjs/releases/1.139/Build/Cesium/Cesium.js"></script>
<script src="./datacube-sdk.js"></script>
<script src="./datacube-viewer.js"></script>
<script>
  (async function () {
    const client = new DataCubeClient('http://your-server:5003', {
      apiKey: 'dcube_...'
    });

    const viewer = client.createViewer('cesiumContainer', {
      terrain: 'vworld',
      imagery: 'vworld'
    });

    await viewer.ready();
    const handle = await viewer.loadTileset('building_bit', { autoZoom: true });
    viewer.setOpacity(handle, 0.8);
    viewer.setColormap(handle, 'jet');
  })();
</script>
```

---

## Async Job 사용 방식

analysis 비동기 작업은 두 방식으로 쓸 수 있습니다.

### 1. 제출만 하기

```javascript
const job = await client.tiles.submitExportGlbAsync('building_bit', {
    bbox: { west: 126.9, south: 37.5, east: 127.0, north: 37.6 },
    max_level: 14
});

console.log(job.job_id);

const status = await client.tiles.jobStatus(job.job_id, {
    include_log: false
});
```

### 2. 제출 후 완료까지 기다리기

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

### 결과 다운로드

```javascript
const result = await client.tiles.downloadJobResult(jobId);

if (result instanceof Blob) {
    console.log('file blob:', result.size);
} else {
    console.log('volume result:', result.volume_m3, result.voxel_count);
}
```

---

## Create API 사용 방식

create 작업은 일반적으로 다음 순서로 진행합니다.

1. `data.upload*()`로 파일 업로드
2. `data.create*()`로 create job 생성
3. `data.jobStatus()` 또는 `data.waitJob()`으로 완료 확인

### 지원 메서드

| 메서드 | 설명 |
|--------|------|
| `data.uploadGlb(files)` | 3D Tiles 소스 업로드 |
| `data.uploadShp(files)` | SHP 세트 또는 zip 업로드 |
| `data.uploadDem(file)` | SHP elevation용 DEM 업로드 |
| `data.uploadLas(files)` | LAS/LAZ 업로드 |
| `data.uploadTif(files)` | GeoTIFF 업로드 |
| `data.uploadNetcdf(files)` | NetCDF/GRIB2 업로드 |
| `data.uploadCube(files)` | cube 결과 업로드 |
| `data.uploadJson(file)` | JSON cube용 JSON/GeoJSON/CSV 업로드 |
| `data.createGlb(name, inputPath, opts)` | GLB create job |
| `data.createLas(name, inputFile, opts)` | LAS create job |
| `data.createTif(name, inputPathOrFiles, opts)` | GeoTIFF create job |
| `data.createNetcdf(name, opts)` | NetCDF/GRIB2 create job |
| `data.createShp(name, inputFiles, opts)` | SHP create job |
| `data.createAdmin(name, geojsonPath, opts)` | admin JSON/GeoJSON create job |
| `data.createStats(name, baseLayer, csvPath, opts)` | stats create job |
| `data.createPoint(name, csvPath, opts)` | point CSV create job |
| `data.createCube(name, inputPath, opts)` | cube 등록 job |
| `data.createVoxelizerGlb/Las/Tif(...)` | 기존 voxelizer create job |

`createGlb/createLas/createTif/createNetcdf/createShp/createAdmin/createStats/createPoint`는 서버가 확장한 옵션을 그대로 변환기에 전달합니다. 기존 voxelizer 경로는 `createVoxelizerGlb/createVoxelizerLas/createVoxelizerTif`를 사용합니다.

### Layer merge

```javascript
const validation = await client.layers.validateMerge(['layer_a', 'layer_b']);
const mergeJob = await client.layers.merge('merged_layer', ['layer_a', 'layer_b'], {
    tile_level: 14,
    is_public: false
});
const sameMergeJob = await client.layers.mergeLayers('merged_layer', ['layer_a', 'layer_b'], {
    tile_level: 14,
    is_public: false
});
```

### create 옵션 참고

`createGlb`, `createLas`, `createTif` 공통 주요 옵션:

- `source_crs`
- `crs` (`source_crs` 별칭)
- `min_level`
- `max_level`
- `voxel_resolution`
- `subtree_levels`
- `cube_data_type`
- `cube_format`
- `terrain`
- `rotate_x_axis`
- `is_public`

`createCube`에서 사용하는 옵션:

- `subtree_levels`
- `is_public`

참고:

- `createCube()`는 이미 준비된 cube 결과를 DB에 등록할 때 사용합니다.
- `createNetcdf()`는 단일 U/V 바람 파일, 단일 스칼라 파일, 시계열 배치 폴더를 지원합니다.
- 시계열 배치 레이어는 viewer가 atlas 메타데이터를 감지하면 자동으로 atlas shader로 로드하며 `viewer.play()`로 재생할 수 있습니다.

---

## 주요 API 요약

| 카테고리 | 메서드 | 설명 |
|---------|--------|------|
| 클라이언트 | `new DataCubeClient(url, options)` | SDK 클라이언트 생성 |
| 클라이언트 | `setApiKey(apiKey)` | API Key 변경 |
| 클라이언트 | `createViewer(containerId, options)` | 브라우저용 `DataCubeViewer` 생성 |
| 레이어 | `layers.list(page, perPage)` | layer 목록 |
| 레이어 | `layers.get(name)` | layer 상세 |
| 레이어 | `layers.stats(name)` | layer 통계 |
| 레이어 | `layers.checkName(name)` | 이름 중복 확인 |
| 레이어 | `layers.manage()` | 관리 가능한 layer 목록 |
| 레이어 | `layers.rename(name, newName)` | 이름 변경 |
| 레이어 | `layers.setVisibility(name, isPublic)` | 공개 여부 변경 |
| 레이어 | `layers.delete(name)` | 삭제 |
| 데이터 | `data.uploadGlb(files)` | GLB 업로드 |
| 데이터 | `data.uploadLas(files)` | LAS 업로드 |
| 데이터 | `data.uploadTif(files)` | GeoTIFF 업로드 |
| 데이터 | `data.uploadNetcdf(files)` | NetCDF/GRIB2 업로드 |
| 데이터 | `data.uploadCube(files)` | Cube 업로드 |
| 데이터 | `data.createGlb(name, inputPath, opts)` | GLB create job |
| 데이터 | `data.createLas(name, inputFile, opts)` | LAS create job |
| 데이터 | `data.createTif(name, inputPathOrFiles, opts)` | GeoTIFF create job |
| 데이터 | `data.createNetcdf(name, opts)` | NetCDF/GRIB2 create job |
| 데이터 | `data.createCube(name, inputPath, opts)` | Cube 등록 job |
| 데이터 | `data.jobStatus(jobId, opts)` | create job 상태 조회 |
| 데이터 | `data.listJobs(status, limit)` | create job 목록 |
| 데이터 | `data.cancelJob(jobId)` | create job 취소 |
| 데이터 | `data.deleteJob(jobId)` | create job 삭제 |
| 데이터 | `data.waitJob(jobId, pollIntervalOrOptions, timeout)` | create job 완료 대기 |
| 데이터 | `data.streamJob(jobId, handlers)` | create job SSE 구독 |
| 타일/분석 | `tiles.list()` | tileset 목록 |
| 타일/분석 | `tiles.info(name)` | tileset 정보 |
| 타일/분석 | `tiles.geojson(name)` | 행정구역/통계 JSON 큐브를 GeoJSON으로 조회 |
| 타일/분석 | `tiles.points(name, opts)` | point_timeseries JSON 큐브를 GeoJSON Point로 조회 |
| 타일/분석 | `tiles.cubegrid(name)` | JSON 큐브 tile footprint/grid 조회 |
| 타일/분석 | `tiles.tilesetUrl(name, filters)` | tileset URL 생성 |
| 타일/분석 | `tiles.volume(name, west, south, east, north)` | volume 계산 |
| 타일/분석 | `tiles.query(name, opts)` | bbox 기반 query |
| 타일/분석 | `tiles.datacube(datacubeId, opts)` | datacube 조회 |
| 타일/분석 | `tiles.coordToIndex(...)` | 좌표 -> 인덱스 |
| 타일/분석 | `tiles.indexToCoord(...)` | 인덱스 -> 좌표 |
| 타일/분석 | `tiles.queryByGeometry(name, geometry, opts)` | geometry query |
| 타일/분석 | `tiles.updateVoxel(name, opts)` | 단일 voxel 수정 |
| 타일/분석 | `tiles.bulkUpdateVoxel(name, opts)` | 일괄 voxel 수정 |
| 타일/분석 | `tiles.updateByGeometry(name, geometry, value, opts)` | geometry 기반 수정 |
| 내보내기 | `tiles.exportGlb(name, opts)` | 즉시 GLB 다운로드 |
| 내보내기 | `tiles.exportBinary(name, opts)` | 즉시 Binary 다운로드 |
| 내보내기 | `tiles.submitExportGlbAsync(name, opts)` | GLB job 제출만 |
| 내보내기 | `tiles.submitExportBinaryAsync(name, opts)` | Binary job 제출만 |
| 내보내기 | `tiles.submitExport3dTilesAsync(name, opts)` | 3D Tiles ZIP export job 제출만 |
| 뷰어 | `viewer.loadTileset(nameOrUrl, options)` | tileset 로드 |
| 뷰어 | `viewer.setOpacity(handle, value)` | 투명도 조절 |
| 뷰어 | `viewer.setColormap(handle, name)` | 색상 표현 변경 |
| 뷰어 | `viewer.play(handle, options)` | timeseries 재생 |
| 뷰어 | `viewer.measure.distance()` | 거리 측정 |
| 뷰어 | `viewer.measure.area()` | 면적 측정 |
| 내보내기 | `tiles.exportGlbAsync(name, opts, jobOpts)` | GLB job 제출 후 완료 대기 |
| 내보내기 | `tiles.exportBinaryAsync(name, opts, jobOpts)` | Binary job 제출 후 완료 대기 |
| 내보내기 | `tiles.export3dTilesAsync(name, opts, jobOpts)` | 3D Tiles ZIP export job 제출 후 완료 대기 |
| 분석 job | `tiles.jobStatus(jobId, opts)` | analysis job 상태 조회 |
| 분석 job | `tiles.listJobs(status, limit)` | analysis job 목록 |
| 분석 job | `tiles.cancelJob(jobId)` | analysis job 취소 |
| 분석 job | `tiles.deleteJob(jobId)` | analysis job 삭제 |
| 분석 job | `tiles.waitJob(jobId, pollIntervalOrOptions, timeout)` | analysis job 완료 대기 |
| 분석 job | `tiles.streamJob(jobId, handlers)` | analysis job SSE 구독 |
| 분석 job | `tiles.downloadJobResult(jobId)` | analysis job 결과 받기 |

---

## 문서

- 빠른 시작: [document/Quick_Start.md](document/Quick_Start.md)
- API 레퍼런스: [document/API_Reference.md](document/API_Reference.md)
- 사용자 매뉴얼: [document/User_Manual.md](document/User_Manual.md)

---

## 요구사항

- 브라우저: ES5+
- Node.js: 18+ 권장
- 외부 의존성: 없음
