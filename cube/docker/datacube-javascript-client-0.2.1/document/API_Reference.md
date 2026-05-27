# DataCube JavaScript SDK API Reference

## 개요

이 문서는 `datacube-sdk.js`와 `datacube-viewer.js` 구현 기준의 JavaScript SDK API 레퍼런스입니다.

- 대상 SDK: JavaScript
- 모듈 형식: 브라우저 전역 `DataCubeClient`, Node.js `require('./datacube-sdk')`
- 브라우저 가시화: 전역 `DataCubeViewer` 및 `client.createViewer()`
- 외부 의존성: API SDK는 없음, viewer는 `Cesium.js` 필요
- 기본 API prefix: `/api`

---

## 1. 클라이언트 생성

```javascript
const client = new DataCubeClient('https://api.example.com', {
    apiKey: 'dcube_...',
    apiPrefix: '/api',
    timeout: 30000,
    uploadTimeout: 1800000
});
```

### 생성자

```javascript
new DataCubeClient(baseUrl, options)
```

### 파라미터

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `baseUrl` | `string` | O | 서버 주소. 예: `https://api.example.com` |
| `options.apiKey` | `string` | X | API Key. 설정하면 모든 요청에 `X-API-Key` 헤더를 넣습니다. |
| `options.apiPrefix` | `string` | X | API prefix. 기본값은 `/api`입니다. |
| `options.timeout` | `number` | X | 일반 요청 타임아웃(ms). 기본값은 `30000`입니다. |
| `options.uploadTimeout` | `number` | X | 파일 업로드 타임아웃(ms). 기본값은 `1800000`이며, `0`이면 클라이언트 타임아웃을 사용하지 않습니다. |

### 프로퍼티

| 이름 | 설명 |
|------|------|
| `client.layers` | Layer API 클라이언트 |
| `client.data` | Upload / Create / Create Job API 클라이언트 |
| `client.tiles` | Tiles / Analysis / Analysis Job API 클라이언트 |
| `client.createViewer` | 브라우저용 `DataCubeViewer` 생성 함수 |

### 메서드

#### `setApiKey(apiKey)`

런타임에 API Key를 바꿉니다.

```javascript
client.setApiKey('dcube_new_key');
```

#### `createViewer(containerId, options)`

브라우저에서 `DataCubeViewer` 인스턴스를 만듭니다.

```javascript
const viewer = client.createViewer('cesiumContainer', {
    terrain: 'vworld',
    imagery: 'vworld'
});
```

### 파라미터

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `containerId` | `string` | O | Cesium을 붙일 DOM 요소 id |
| `options.terrain` | `string` | X | `vworld` 또는 기본 terrain |
| `options.imagery` | `string` | X | `vworld`, `osm` 등 |
| `options.camera` | `object` | X | 초기 카메라 위치/방향 |
| `options.depthTestTerrain` | `boolean` | X | terrain depth test 사용 여부 |
| `options.boundaries` | `boolean` | X | VWorld 경계 레이어 사용 여부 |
| `options.cesiumOptions` | `object` | X | `Cesium.Viewer` 생성 옵션 override |

---

## 1-1. Viewer API

`datacube-viewer.js`는 브라우저 전용이다. Node.js 환경에서는 viewer를 만들지 않는다.

### `viewer.ready()`

Cesium 초기화 완료를 기다린다.

```javascript
await viewer.ready();
```

### `viewer.loadTileset(nameOrUrl, options)`

tileset을 로드하고 handle을 반환한다.

```javascript
const handle = await viewer.loadTileset('seoul-dem', {
    autoZoom: true,
    opacity: 0.9
});
```

주요 옵션:

| 이름 | 타입 | 설명 |
|------|------|------|
| `autoZoom` | `boolean` | 로드 후 자동 zoom |
| `opacity` | `number` | 초기 투명도 |
| `filters` | `object` | `tilesetUrl()`에 전달할 filter |
| `shader` | `string` | `query` 등 shader 모드 |
| `solidColor` | `string` | `#rrggbb` 형식 고정 색상 |
| `colormap` | `string` | `jet`, `solid` |
| `heightOffset` | `number` | 높이 보정값 |
| `colorRangeMin` | `number` | query 색상 범위 최소 |
| `colorRangeMax` | `number` | query 색상 범위 최대 |
| `atlas` | `boolean` | 시계열 레이어에서 atlas 자동 로드를 사용할지 여부. 기본값은 `true` |

시계열 NetCDF 레이어는 서버의 `/atlas/<layer>/atlas_meta.json`이 존재하면 atlas shader로 자동 로드됩니다. 일반 tileset 로드를 강제하려면 `{ atlas: false }`를 넘깁니다.

### `viewer.unloadTileset(handle)` / `viewer.unloadAllTilesets()`

로드한 tileset을 제거한다.

### `viewer.getTilesets()`

현재 로드된 tileset handle 배열을 반환한다.

### `viewer.setOpacity(handle, value)`

tileset 투명도를 바꾼다.

### `viewer.setColormap(handle, name)`

색상 표현을 바꾼다. 현재 `jet`, `solid`를 지원한다.

### `viewer.setSolidColor(handle, hexColor)`

단색 표현일 때 색상을 바꾼다.

### `viewer.setColorRange(handle, min, max)`

query 색상 범위를 바꾼다.

### `viewer.setHeightOffset(handle, meters)`

tileset 높이 오프셋을 바꾼다.

### `viewer.getTimeseries(handle)`

로드된 시계열 handle의 프레임 개수와 timestamp 목록을 반환합니다. 시계열이 아니면 `null`을 반환합니다.

```javascript
const info = viewer.getTimeseries(handle);
console.log(info.count, info.timestamps);
```

### `viewer.setTimeIndex(handle, index)` / `viewer.getTimeIndex(handle)`

시계열 프레임을 지정하거나 현재 프레임 인덱스를 조회합니다. atlas shader는 소수 인덱스 보간을 지원할 수 있습니다.

### `viewer.play(handle, options)` / `viewer.pause(handle)` / `viewer.isPlaying(handle)`

시계열 레이어를 재생하거나 일시정지합니다.

```javascript
viewer.play(handle, { speed: 1.0 });
viewer.pause(handle);
```

### `viewer.flyTo(options)` / `viewer.setView(options)` / `viewer.zoomToTileset(handle)`

카메라 이동 관련 메서드다.

### `viewer.viewNorth()` / `viewer.zoomIn()` / `viewer.zoomOut()`

기본 카메라 제어 메서드다.

### `viewer.setTerrainOpacity(alpha)`

terrain 투명도를 조절한다.

### `viewer.measure.distance()` / `viewer.measure.area()` / `viewer.measure.clear()`

거리/면적 측정 UI를 제공한다.

### `viewer.selectArea()` / `viewer.clearArea()`

화면에서 영역을 선택하거나 선택 상태를 제거한다.

### `viewer.destroy()`

viewer와 로드된 리소스를 정리한다.

---

## 2. Layers API

### `layers.list(page, perPage)`

조회 가능한 layer 목록을 가져옵니다.

```javascript
const layers = await client.layers.list(1, 50);
console.log(layers.length);
console.log(layers.pagination);
```

### 파라미터

| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `page` | `number` | X | `1` | 페이지 번호 |
| `perPage` | `number` | X | `50` | 페이지 크기 |

### 반환

- 반환값은 `Array`입니다.
- 서버의 `pagination` 정보는 배열 객체의 `pagination` 프로퍼티로 함께 붙습니다.

```javascript
const layers = await client.layers.list();
console.log(Array.isArray(layers)); // true
console.log(layers.pagination);     // { page, per_page, total }
```

### 각 항목 주요 필드

| 필드 | 설명 |
|------|------|
| `layer_id` | layer ID |
| `layer_name` | layer 이름 |
| `layer_type` | layer 타입 |
| `owner_id` | 소유자 ID |
| `crs` | 좌표계 |
| `bounds` | 경계 정보 |
| `origin` | origin 정보 |
| `rotation` | rotation 정보 |
| `is_public` | 공개 여부 |
| `created_at` | 생성 시각 |

---

### `layers.get(layerName)`

특정 layer 상세를 조회합니다.

```javascript
const layer = await client.layers.get('seoul-dem');
console.log(layer.tileset);
console.log(layer.datacube_count);
```

### 파라미터

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `layerName` | `string` | O | layer 이름 |

### 반환 주요 필드

`layers.list()`의 필드에 더해 다음 값이 올 수 있습니다.

| 필드 | 설명 |
|------|------|
| `tileset` | 연결된 tileset 메타데이터 |
| `datacube_count` | layer에 속한 datacube 개수 |

---

### `layers.stats(layerName)`

layer 통계를 조회합니다.

```javascript
const stats = await client.layers.stats('seoul-dem');
console.log(stats.datacube_count, stats.datablock_count, stats.tile_count);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `layer_name` | layer 이름 |
| `layer_type` | layer 타입 |
| `crs` | 좌표계 |
| `bounds` | 경계 정보 |
| `is_public` | 공개 여부 |
| `datacube_count` | datacube 수 |
| `datablock_count` | datablock 수 |
| `tile_count` | tile 수 |

---

### `layers.checkName(name)`

layer 이름 중복 여부를 확인합니다.

```javascript
const result = await client.layers.checkName('seoul-dem');
console.log(result.exists, result.name);
```

### 반환

| 필드 | 설명 |
|------|------|
| `exists` | 같은 이름의 layer 존재 여부 |
| `name` | 검사한 이름 |

---

### `layers.manage()`

관리 가능한 layer 목록을 가져옵니다.

```javascript
const layers = await client.layers.manage();
```

### 반환

- 반환값은 `Array`입니다.
- `layers.list()`와 달리 `pagination`은 없습니다.

---

### `layers.rename(layerName, newName)`

layer 이름을 변경합니다.

```javascript
await client.layers.rename('old_name', 'new_name');
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `layer_id` | 대상 layer ID |
| `layer_name` | 변경 후 이름 |
| `message` | 처리 결과 메시지 |
| `old_name` | 실제 rename이 일어난 경우 기존 이름 |

---

### `layers.setVisibility(layerName, isPublic)`

layer 공개 여부를 바꿉니다.

```javascript
await client.layers.setVisibility('seoul-dem', true);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `layer_id` | 대상 layer ID |
| `layer_name` | layer 이름 |
| `is_public` | 변경 후 공개 여부 |

---

### `layers.delete(layerName)`

layer를 삭제합니다.

```javascript
await client.layers.delete('seoul-dem');
```

### 반환

| 필드 | 설명 |
|------|------|
| `message` | 삭제 결과 메시지 |

---

## 3. Data API

## 3.1 Upload

### `data.uploadGlb(files)`

3D Tiles 소스 파일을 업로드합니다.

```javascript
const upload = await client.data.uploadGlb(fileInput.files);
console.log(upload.upload_dir);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `upload_dir` | 서버 업로드 디렉터리 |
| `glb_files` | 저장된 파일 경로 배열 |
| `saved_files` | 저장된 파일 경로 배열 |
| `relative_files` | 유지된 상대 경로 배열 |
| `file_count` | 저장 파일 수 |
| `ignored_count` | 무시된 파일 수 |
| `has_tileset_json` | `tileset.json` 포함 여부 |

### 참고

- 브라우저에서 `webkitRelativePath`가 있으면 상대 경로를 유지해서 업로드합니다.

---

### `data.uploadLas(files)`

LAS/LAZ 파일을 업로드합니다.

```javascript
const upload = await client.data.uploadLas(fileInput.files);
console.log(upload.las_file, upload.detected_crs);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `upload_dir` | 서버 업로드 디렉터리 |
| `las_file` | 저장된 LAS/LAZ 파일 경로 |
| `file_count` | 저장 파일 수 |
| `detected_crs` | 자동 감지된 CRS |

---

### `data.uploadTif(files)`

GeoTIFF 파일을 업로드합니다.

```javascript
const upload = await client.data.uploadTif(fileInput.files);
console.log(upload.tif_files);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `upload_dir` | 서버 업로드 디렉터리 |
| `tif_file` | 첫 번째 TIFF 경로 |
| `tif_files` | 전체 TIFF 경로 배열 |
| `file_count` | 저장 파일 수 |

---

### `data.uploadNetcdf(files)`

NetCDF/GRIB2 입력 파일을 업로드합니다. 폴더 선택이나 zip 업로드 시 상대 경로를 유지합니다.

```javascript
const upload = await client.data.uploadNetcdf(fileInput.files);
console.log(upload.upload_dir, upload.files);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `upload_dir` | 서버 업로드 디렉터리 |
| `files` | 저장된 NetCDF/GRIB2 파일 경로 배열 |
| `saved_files` | 저장된 파일 경로 배열 |
| `relative_files` | 유지된 상대 경로 배열 |
| `file_count` | 저장 파일 수 |
| `ignored_count` | 무시된 파일 수 |
| `extracted_count` | zip에서 추출된 파일 수 |

---

### `data.uploadCube(files)`

voxelizer cube 결과를 업로드합니다.

```javascript
const upload = await client.data.uploadCube(fileInput.files);
console.log(upload.has_cube_files, upload.has_voxelset_json);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `upload_dir` | 서버 업로드 디렉터리 |
| `saved_files` | 저장된 파일 경로 배열 |
| `relative_files` | 유지된 상대 경로 배열 |
| `file_count` | 저장 파일 수 |
| `ignored_count` | 무시된 파일 수 |
| `has_cube_files` | cube 데이터 파일 포함 여부 |
| `has_voxelset_json` | `voxelset.json` 포함 여부 |

---

### `data.uploadJson(file)`

JSON cube 생성에 쓰는 JSON/GeoJSON/CSV 단일 파일을 업로드합니다.

```javascript
const upload = await client.data.uploadJson(fileInput.files[0]);
console.log(upload.filepath, upload.columns);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `filepath` | 서버에 저장된 파일 경로 |
| `filename` | 서버에 저장된 파일명 |
| `columns` | CSV 컬럼명 배열 |
| `preview` | CSV 최대 5행 미리보기 |

### 참고

- JSON/GeoJSON 파일이면 `columns`는 빈 배열, `preview`는 `null`일 수 있습니다.

---

## 3.2 Create

### `data.createGlb(tilesetName, inputPath, opts)`

3D Tiles 입력으로 create job을 생성합니다.

```javascript
const job = await client.data.createGlb('building-bit', upload.upload_dir, {
    source_crs: 'EPSG:4326',
    terrain: '/srv/dem/terrain.tif',
    voxel_resolution: 64,
    max_level: 16,
    subtree_levels: 3,
    is_public: false
});
```

### `data.createLas(tilesetName, inputFile, opts)`

LAS/LAZ 입력으로 create job을 생성합니다.

```javascript
const job = await client.data.createLas('seoul-lidar', upload.las_file, {
    source_crs: upload.detected_crs,
    voxel_resolution: 64,
    max_level: 14
});
```

### `data.createTif(tilesetName, inputFileOrFiles, opts)`

GeoTIFF 입력으로 create job을 생성합니다.

```javascript
await client.data.createTif('terrain-2026', upload.upload_dir, {
    source_crs: 'EPSG:5186',
    voxel_resolution: 64
});

await client.data.createTif('terrain-2026', upload.tif_file, {
    source_crs: 'EPSG:5186'
});

await client.data.createTif('terrain-2026', upload.tif_files, {
    source_crs: 'EPSG:5186'
});
```

### `data.createNetcdf(tilesetName, opts)`

GRIB2/NetCDF 입력으로 create job을 생성합니다.

단일 바람 U/V 입력:

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
```

단일 스칼라 입력:

```javascript
const job = await client.data.createNetcdf('scalar_1000hpa', {
    mode: 'single',
    data_type: 'scalar',
    input_file: upload.files[0],
    data_height: 1000,
    max_level: 3,
    voxel_resolution: 64
});
```

시계열 배치 입력:

```javascript
const job = await client.data.createNetcdf('wind_timeseries_1000hpa', {
    mode: 'batch',
    input_dir: upload.upload_dir,
    pressure: 1000,
    max_level: 3,
    voxel_resolution: 64,
    value_type: 'float',
    tile_height: 4000000,
    subtree_levels: 3
});
```

### `data.createCube(tilesetName, inputPath, opts)`

이미 생성된 cube 결과를 DB에 등록하는 create job을 생성합니다.

```javascript
await client.data.createCube('cube-import', upload.upload_dir, {
    subtree_levels: 3,
    is_public: false
});
```

### `createGlb` / `createLas` / `createTif` / `createNetcdf` 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `source_crs` | `string` | 원본 CRS |
| `crs` | `string` | `source_crs` 별칭. SDK 내부에서 `source_crs`로 변환 |
| `min_level` | `number` | 최소 레벨 |
| `max_level` | `number` | 최대 레벨 |
| `voxel_resolution` | `number` | `64` 또는 `128` |
| `subtree_levels` | `number` | subtree depth |
| `cube_data_type` | `string` | 예약 옵션 |
| `cube_format` | `string` | 예약 옵션 |
| `terrain` | `string` | DEM 파일 경로 또는 voxelizer `--terrain` 입력 |
| `rotate_x_axis` | `boolean` | X축 회전 여부 |
| `is_public` | `boolean` | 공개 여부 |

NetCDF 전용 옵션:

| 옵션 | 타입 | 설명 |
|------|------|------|
| `mode` | `string` | `single` 또는 `batch` |
| `data_type` | `string` | 단일 모드에서 `wind` 또는 `scalar` |
| `u_file` / `v_file` | `string` | 단일 wind 모드 U/V 파일 경로 |
| `input_file` | `string` | 단일 scalar 모드 파일 경로 |
| `input_dir` | `string` | batch 모드 업로드 디렉터리 |
| `pressure` | `number` | batch 모드 대상 기압(hPa) |
| `data_height` | `number` | 단일 모드 데이터 높이(m), 생략 시 서버 기본값 |
| `value_type` | `string` | `float`, `double`, `int`, `short`, `byte` 등 |

### `createCube` 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `subtree_levels` | `number` | subtree depth |
| `is_public` | `boolean` | 공개 여부 |

### 반환

네 create 메서드 모두 같은 형태의 job 메타데이터를 반환합니다.

| 필드 | 설명 |
|------|------|
| `job_id` | create job ID |
| `status` | 제출 직후 상태 |
| `task_type` | `glb`, `las`, `tif`, `cube` |
| `tileset_name` | 대상 tileset 이름 |

---

## 3.3 Create Job

### `data.jobStatus(jobId, opts)`

create job 상세를 조회합니다.

```javascript
const status = await client.data.jobStatus(jobId, { include_log: true });
```

### 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `include_log` | `boolean` | `true`면 로그 포함, `false`면 로그 없이 조회 |

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `job_id` | job ID |
| `task_type` | job 타입 |
| `tileset_name` | 대상 tileset 이름 |
| `status` | 현재 상태 |
| `job_kind` | 항상 `create` |
| `progress` | 진행률 |
| `current_step` | 현재 단계 |
| `cancel_requested` | 취소 요청 여부 |
| `can_cancel` | 취소 가능 여부 |
| `can_delete` | 삭제 가능 여부 |
| `log` | 로그 문자열 |
| `log_truncated` | 로그 truncation 여부 |

---

### `data.listJobs(status, limit)`

create job 목록을 가져옵니다.

```javascript
const jobs = await client.data.listJobs('PROCESSING', 100);
```

### 반환

- 반환값은 `Array`입니다.
- 각 항목은 `jobStatus()`의 요약 버전입니다.

---

### `data.deleteJob(jobId)`

종료된 create job을 삭제합니다.

```javascript
await client.data.deleteJob(jobId);
```

### 반환

| 필드 | 설명 |
|------|------|
| `job_id` | 삭제된 job ID |
| `action` | 항상 `deleted` |

---

### `data.cancelJob(jobId)`

create job 취소를 요청합니다.

```javascript
await client.data.cancelJob(jobId);
```

### 반환

| 필드 | 설명 |
|------|------|
| `job_id` | 대상 job ID |
| `action` | `cancel_requested`, `canceled`, `noop` 중 하나 |
| `status` | 취소 시점 상태 |

---

### `data.streamJob(jobId, handlers)`

create job 상태를 SSE로 구독합니다.

```javascript
const stream = client.data.streamJob(jobId, {
    status: function (payload) { console.log('status', payload); },
    log: function (payload) { console.log('log', payload); },
    complete: function (payload) { console.log('done', payload); },
    onError: function (err) { console.error(err); }
});

await stream.done;
```

### 반환

| 필드 | 설명 |
|------|------|
| `close()` | 스트림 종료 |
| `done` | 스트림 종료까지 기다리는 Promise |

### handlers 지원 항목

| 이름 | 설명 |
|------|------|
| `onOpen` | 연결 직후 호출 |
| `onClose` | 종료 시 호출 |
| `onError` | 에러 시 호출 |
| `onEvent` | 모든 이벤트 공통 콜백 |
| `status` | `status` 이벤트 |
| `log` | `log` 이벤트 |
| `heartbeat` | `heartbeat` 이벤트 |
| `complete` | 성공 종료 이벤트 |
| `error` | 실패 종료 이벤트 |
| `canceled` | 취소 종료 이벤트 |

---

### `data.waitJob(jobId, pollIntervalOrOptions, timeout)`

create job 완료까지 polling합니다.

```javascript
const result = await client.data.waitJob(jobId, 2000, 600000);

const result2 = await client.data.waitJob(jobId, {
    pollInterval: 1000,
    timeout: 600000,
    onProgress: function (status) {
        console.log(status.progress, status.current_step);
    }
});
```

### 인자 형식

| 형식 | 설명 |
|------|------|
| `waitJob(jobId, pollInterval, timeout)` | 숫자 기반 간단 호출 |
| `waitJob(jobId, { pollInterval, timeout, onProgress })` | 옵션 객체 기반 호출 |

---

## 4. Tiles / Analysis API

### `tiles.list()`

조회 가능한 tileset 목록을 가져옵니다.

```javascript
const tilesets = await client.tiles.list();
```

### 반환

- 반환값은 `Array`입니다.

### 각 항목 주요 필드

| 필드 | 설명 |
|------|------|
| `layer_name` | layer 이름 |
| `layer_type` | layer 타입 |
| `crs` | 좌표계 |
| `bounds` | 경계 정보 |
| `tileset_name` | tileset 이름 |
| `geometric_error` | geometric error |
| `is_admin_data` | 행정구역 기준 데이터 여부 |
| `is_public` | 공개 여부 |
| `created_at` | 생성 시각 |

---

### `tiles.info(tilesetName)`

tileset 메타 정보를 조회합니다.

```javascript
const info = await client.tiles.info('seoul-dem');
console.log(info.name, info.block_count, info.timestamps);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `name` | tileset 이름 |
| `block_count` | datablock block 수 |
| `timestamps` | 시계열 timestamp 배열 |
| `is_json_cube` | JSON payload 큐브 여부 |
| `is_point_timeseries` | 좌표 시계열 JSON 큐브 여부 |
| `point_fields` | point_timeseries 측정 필드 목록 |
| `point_time_range` | point_timeseries 시간 범위 |

---

### `tiles.geojson(tilesetName)`

행정구역/통계 JSON 큐브를 GeoJSON FeatureCollection으로 조회합니다.

```javascript
const geojson = await client.tiles.geojson('admin_stats_cube');
console.log(geojson.features.length, geojson.stats_fields);
```

일반 voxel 큐브는 `tilesetUrl()` 또는 viewer의 3D Tiles 경로를 사용하고, `is_json_cube`인 큐브만 이 API를 사용합니다.

---

### `tiles.points(tilesetName, opts)`

`point_timeseries` JSON 큐브를 GeoJSON Point FeatureCollection으로 조회합니다.

```javascript
const points = await client.tiles.points('weather_points', {
    time_index: 0,
    field: 'temperature'
});
console.log(points.features.length, points.fields, points.time_range);
```

`opts.time_index`와 `opts.field`를 생략하면 각 station의 전체 `timeseries`가 반환됩니다.

---

### `tiles.cubegrid(tilesetName)`

JSON 큐브의 tile footprint와 tile별 region/stat 요약을 GeoJSON으로 조회합니다.

```javascript
const grid = await client.tiles.cubegrid('admin_stats_cube');
console.log(grid.tile_count, grid.tile_level, grid.features[0].properties.regions);
```

---

### `tiles.tilesetUrl(tilesetName, filters)`

Cesium 등에서 사용할 `tileset.json` URL을 생성합니다.

```javascript
const url = client.tiles.tilesetUrl('seoul-dem', {
    timestamp: '2026-03-31T00:00:00'
});
```

### 참고

- `apiKey`가 설정되어 있으면 URL query에 `key=`를 자동으로 붙입니다.
- `filters` 객체의 값은 그대로 query string에 추가됩니다.

---

### `tiles.volume(layerName, west, south, east, north)`

bbox 내 volume을 계산합니다.

```javascript
const result = await client.tiles.volume('seoul-dem', 126.9, 37.45, 127.1, 37.65);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `volume_m3` | 부피 |
| `voxel_count` | voxel 수 |
| `voxel_size_m3` | voxel 1개 부피 |

---

### `tiles.query(layerName, opts)`

bbox / 높이 / 값 조건으로 datacube를 조회합니다.

```javascript
const summary = await client.tiles.query('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 }
});

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
```

### 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `bbox` | `object` | `{ west, south, east, north }` |
| `height_min` | `number` | 최소 높이 |
| `height_max` | `number` | 최대 높이 |
| `value_op` | `string` | `>=`, `<=`, `=`, `!=`, `range` |
| `value1` | `number` | 값 조건 1 |
| `value2` | `number` | 값 조건 2 |
| `timestamp` | `string` | 시계열 timestamp |
| `format` | `string` | `summary` 또는 `detail` |
| `limit` | `number` | detail 모드 limit |
| `offset` | `number` | detail 모드 offset |

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `layer_name` | 조회 layer 이름 |
| `layer_type` | layer 타입 |
| `level` | 조회 기준 level |
| `bbox` | 적용 bbox |
| `datacube_count` | bbox에 걸리는 datacube 수 |
| `datablock_count` | bbox에 걸리는 datablock 수 |
| `tile_range` | tile index 범위 |
| `cube_height_m` | cube 높이 |
| `voxel_size_m` | voxel 크기 |
| `height_filter` | 높이 필터 |
| `voxel_count` | detail 모드 복셀 수 |
| `volume_m3` | detail 모드 volume |
| `datacube_count_filtered` | detail 모드 필터 후 datacube 수 |
| `pagination` | detail 모드 페이지 정보 |
| `datacubes` | detail 모드 상세 배열 |

---

### `tiles.datacube(datacubeId, opts)`

특정 datacube의 raw 또는 voxel 데이터를 조회합니다.

```javascript
const raw = await client.tiles.datacube('11_1_12_2048_1024_0', {
    format: 'raw',
    include_data: true
});

const voxels = await client.tiles.datacube('11_1_12_2048_1024_0', {
    format: 'voxels',
    offset: 0,
    limit: 1000,
    timestamp: '2026-03-31T00:00:00'
});
```

### 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `format` | `string` | `raw` 또는 `voxels` |
| `include_data` | `boolean` | raw 모드에서 base64 데이터 포함 여부 |
| `offset` | `number` | voxels 모드 offset |
| `limit` | `number` | voxels 모드 limit |
| `timestamp` | `string` | 시계열 timestamp |

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `datacube_id` | datacube ID |
| `timestamp` | 선택된 timestamp |
| `voxel_size` | voxel 해상도 |
| `block_count` | datablock block 수 |
| `byte_length` | raw 모드 byte 길이 |
| `datablock_base64` | raw 모드 base64 데이터 |
| `voxels` | voxels 모드 희소 voxel 배열 |
| `total_filled` | 전체 채워진 voxel 수 |
| `returned` | 반환 voxel 수 |
| `offset` | 현재 offset |
| `has_more` | 다음 페이지 존재 여부 |

---

### `tiles.exportGlb(layerName, opts)`

조건에 맞는 결과를 즉시 GLB 또는 ZIP으로 내려받습니다.

```javascript
const blob = await client.tiles.exportGlb('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 },
    max_level: 12
});
```

### `tiles.exportBinary(layerName, opts)`

조건에 맞는 datablock binary를 ZIP으로 내려받습니다.

```javascript
const blob = await client.tiles.exportBinary('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 },
    min_level: 10,
    max_level: 12
});
```

### 공통 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `bbox` | `object` | `{ west, south, east, north }` |
| `height_min` | `number` | 최소 높이 |
| `height_max` | `number` | 최대 높이 |
| `value_op` | `string` | 값 조건 연산자 |
| `value1` | `number` | 값 조건 1 |
| `value2` | `number` | 값 조건 2 |
| `min_level` | `number` | 최소 level |
| `max_level` | `number` | 최대 level |
| `limit` | `number` | 최대 스캔 수 |

### 반환

- `exportGlb()`는 `Blob`을 반환합니다.
- 결과가 1개면 `.glb`, 여러 개면 `.zip`일 수 있습니다.
- `exportBinary()`는 `Blob` ZIP을 반환합니다.

---

### `tiles.coordToIndex(layerName, lon, lat, height, level)`

경위도/높이를 datacube 및 voxel 인덱스로 변환합니다.

```javascript
const idx = await client.tiles.coordToIndex('seoul-dem', 127.0, 37.5, 35, 12);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `datacube` | datacube 인덱스 정보 |
| `voxel` | voxel 인덱스 정보 |
| `input` | 입력 좌표 |

---

### `tiles.indexToCoord(layerName, col, row, floor, voxel, level)`

datacube/voxel 인덱스를 좌표 범위로 변환합니다.

```javascript
const coord = await client.tiles.indexToCoord(
    'seoul-dem',
    2048,
    1024,
    0,
    { vx: 32, vy: 14, vz: 18 },
    12
);
```

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `datacube` | datacube 좌표 범위 |
| `voxel` | voxel 좌표 범위. `voxel` 인자를 줬을 때만 포함 |

---

### `tiles.queryByGeometry(layerName, geometry, opts)`

geometry 조건으로 voxel을 조회합니다.

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

### 지원 geometry

| type | 설명 |
|------|------|
| `point` | 점 |
| `line` | 선 |
| `polygon` | 다각형 |
| `circle` | 원 |
| `box3d` | 3차원 박스 |

---

### `tiles.updateVoxel(layerName, opts)`

단일 voxel 값을 수정합니다.

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

---

### `tiles.bulkUpdateVoxel(layerName, opts)`

패턴 기반으로 voxel을 일괄 수정합니다.

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
```

### 주요 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `level` | `number` | 대상 level |
| `col`, `row`, `floor` | `number|string` | 인덱스 또는 `"*"` |
| `vx`, `vy`, `vz` | `number|string` | voxel 인덱스 또는 `"*"` |
| `value` | `number|null` | 새 값 |
| `block_index` | `number` | block index |
| `dry_run` | `boolean` | 실제 수정 없이 영향 범위만 확인 |
| `include_empty` | `boolean` | 빈 voxel 포함 여부 |

---

### `tiles.updateByGeometry(layerName, geometry, value, opts)`

geometry로 선택된 voxel들을 수정합니다.

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

### 주요 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `include_empty` | `boolean` | 빈 voxel 포함 여부 |
| `limit` | `number` | 최대 처리 수 |

---

## 5. Analysis Job API

### `tiles.jobStatus(jobId, opts)`

analysis job 상세를 조회합니다.

```javascript
const status = await client.tiles.jobStatus(jobId, { include_log: true });
```

### 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `include_log` | `boolean` | 로그 포함 여부 |

### 반환 주요 필드

| 필드 | 설명 |
|------|------|
| `job_id` | job ID |
| `task_type` | job 타입 |
| `status` | 현재 상태 |
| `job_kind` | 항상 `analysis` |
| `progress` | 진행률 |
| `current_step` | 현재 단계 |
| `cancel_requested` | 취소 요청 여부 |
| `can_cancel` | 취소 가능 여부 |
| `can_delete` | 삭제 가능 여부 |
| `log` | 로그 문자열 |
| `log_truncated` | 로그 truncation 여부 |

---

### `tiles.listJobs(status, limit)`

analysis job 목록을 가져옵니다.

```javascript
const jobs = await client.tiles.listJobs('PROCESSING', 100);
```

### 반환

- 반환값은 `Array`입니다.

---

### `tiles.deleteJob(jobId)`

종료된 analysis job을 삭제합니다.

```javascript
await client.tiles.deleteJob(jobId);
```

---

### `tiles.cancelJob(jobId)`

진행 중 analysis job 취소를 요청합니다.

```javascript
await client.tiles.cancelJob(jobId);
```

---

### `tiles.waitJob(jobId, pollIntervalOrOptions, timeout)`

analysis job 완료까지 polling합니다.

```javascript
await client.tiles.waitJob(jobId, {
    pollInterval: 1000,
    timeout: 600000,
    onProgress: function (status) {
        console.log(status.progress, status.current_step);
    }
});
```

### 동작

- `SUCCESS`면 resolve
- `FAIL` / `FAILED`면 reject
- `CANCELED` / `CANCELLED`면 reject

---

### `tiles.streamJob(jobId, handlers)`

analysis job 상태를 SSE로 구독합니다.

```javascript
const stream = client.tiles.streamJob(jobId, {
    status: function (payload) { console.log(payload); },
    complete: function (payload) { console.log(payload); }
});
```

### 반환

| 필드 | 설명 |
|------|------|
| `close()` | 스트림 종료 |
| `done` | 종료까지 기다리는 Promise |

---

### `tiles.downloadJobResult(jobId)`

완료된 analysis job 결과를 가져옵니다.

```javascript
const result = await client.tiles.downloadJobResult(jobId);
```

### 반환

| 경우 | 반환 타입 |
|------|-----------|
| volume job | `object` |
| export job | `Blob` |

### volume job 반환 예

```javascript
{
    volume_m3: 1284000.25,
    voxel_count: 125000,
    voxel_size_m3: 10.272
}
```

---

## 6. Async Helper Methods

이 섹션의 메서드는 모두 서버의 비동기 job API를 사용합니다. 차이는 SDK가 `job 제출만 할지`, `제출 후 완료까지 기다릴지`입니다.

### 제출 후 완료까지 기다리는 메서드

| 메서드 | 설명 |
|--------|------|
| `tiles.exportGlbAsync(layerName, opts, jobOpts)` | GLB export job 제출 후 완료까지 대기 |
| `tiles.exportBinaryAsync(layerName, opts, jobOpts)` | Binary export job 제출 후 완료까지 대기 |
| `tiles.export3dTilesAsync(layerName, opts, jobOpts)` | 3D Tiles ZIP export job 제출 후 완료까지 대기 |
| `tiles.volumeAsync(layerName, west, south, east, north, jobOpts)` | volume job 제출 후 완료까지 대기 |
| `tiles.bulkUpdateVoxelAsync(layerName, opts, jobOpts)` | bulk update job 제출 후 완료까지 대기 |
| `tiles.updateByGeometryAsync(layerName, geometry, value, jobOpts)` | geometry update job 제출 후 완료까지 대기 |

### 제출만 하는 메서드

| 메서드 | 설명 |
|--------|------|
| `tiles.submitExportGlbAsync(layerName, opts)` | GLB export job 제출만 수행 |
| `tiles.submitExportBinaryAsync(layerName, opts)` | Binary export job 제출만 수행 |
| `tiles.submitExport3dTilesAsync(layerName, opts)` | 3D Tiles ZIP export job 제출만 수행 |

### `jobOpts`

`exportGlbAsync`, `exportBinaryAsync`, `volumeAsync`, `bulkUpdateVoxelAsync`, `updateByGeometryAsync`는 다음 `jobOpts`를 받습니다.

| 옵션 | 타입 | 설명 |
|------|------|------|
| `pollInterval` | `number` | polling 간격(ms) |
| `timeout` | `number` | 전체 대기 제한(ms) |
| `onSubmitted` | `function` | job 제출 직후 `{ job_id }` 전달 |
| `onProgress` | `function` | polling 중 상태 객체 전달 |

### 예시 1: 제출만 수행

```javascript
const job = await client.tiles.submitExportGlbAsync('seoul-dem', {
    bbox: { west: 126.9, south: 37.45, east: 127.1, north: 37.65 },
    max_level: 12
});

console.log(job.job_id);

const status = await client.tiles.jobStatus(job.job_id, { include_log: false });
```

### 예시 2: 제출 후 완료까지 대기

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
        console.log((s.progress || 0) + '%', s.current_step || s.status);
    }
});
```

### `updateByGeometryAsync` 전용 jobOpts

이 메서드는 아래 옵션도 함께 씁니다.

| 옵션 | 타입 | 설명 |
|------|------|------|
| `include_empty` | `boolean` | 빈 voxel 포함 여부 |
| `limit` | `number` | 최대 처리 수 |
| `level` | `number` | 대상 level |

---

## 7. 오류 처리

SDK는 HTTP 오류 시 `Error`를 throw합니다.

### JavaScript 예시

```javascript
try {
    await client.layers.get('nonexistent');
} catch (err) {
    console.error(err.status);
    console.error(err.message);
    console.error(err.response);
}
```

### 주요 특성

| 필드 | 설명 |
|------|------|
| `err.status` | HTTP status |
| `err.message` | 에러 메시지 |
| `err.response` | JSON 응답 본문이 있으면 포함 |

### 일반적인 서버 오류 응답 형식

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

## 8. 버전 메모

- 본 문서는 현재 `datacube-sdk.js` 구현 기준입니다.
- `layers.list()`는 배열을 반환하고 `pagination`을 배열 객체에 추가합니다.
- `tiles.info()`는 서버의 raw JSON 본문을 그대로 반환합니다.
- `tiles.downloadJobResult()`는 job 종류에 따라 `Blob` 또는 JSON 객체를 반환할 수 있습니다.
