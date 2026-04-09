// 단수 
let table = 1;

while( table < 13 ) {

    console.log(`${table}단`)

    for(let i = 1; i < 10; i++){

        if(table < 10){
            console.log(`0${table} X 0${i} = ${table*i}`)
        }else{
            console.log(`${table} X 0${i} = ${table*i}`)
        }

    }
    // 단과 단사이의 공백
    console.log(`\n`)

    table = table + 1;
};



