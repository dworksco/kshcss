// tableStart → 시작 단수, tableEnd → 끝 단수
function timesTable( tableStart, tableEnd ){
    
    for( let table = tableStart; table <= tableEnd; table++ ) {
    
        console.log(`${table}단`)
    
        for(let i = 1; i < 10; i++){
    
            // 마지막 단수 길이에 맞춰 공백 생성
            const t = String(table).padStart(String(tableEnd).length, ' ');
    
            console.log(`${t} X ${i} = ${table*i}`)
    
        }
    
        // 단과 단사이의 공백
        console.log(`\n`)
    };

}


timesTable(99, 100)


