//網址：https://push-hub.onrender.com/?token=金鑰
var token,message="startTime:"+new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}),done=0
const http=require('http'),https=require('https'),fs=require('fs')
http.createServer((req,res)=>{
 if(req.url=="/"){res.writeHead(200,{'content-type':'text/plain;charset=utf-8','access-control-allow-origin':'*'});res.end(message);return}
 if(req.url=="/favicon.ico"){res.end();return}
 const tmp=req.url.match(/^\/\?token=(.+)/)
 if(tmp&&done==0){token=tmp[1];res.end(token);/*seven11(range)*/;FamilyMart(range);return}
 res.end('others')
}).listen(8080)

const power2=Math.pow(2,15)
var range=fs.readFileSync('All15.xy','utf-8').split('\n')
range.forEach((item,index)=>{
 item=item.split('/')
 const x=+item[0],y=+item[1]
 const lon_min=360*x/power2-180,lon_max=360*(x+1)/power2-180
 let n
 n=Math.PI*(1-2*y/power2);const lat_max=Math.atan((Math.exp(n)-Math.exp(-n))/2)*180/Math.PI
 n=Math.PI*(1-2*(y+1)/power2);const lat_min=Math.atan((Math.exp(n)-Math.exp(-n))/2)*180/Math.PI
 range[index]={Index:index,Left:lon_min.toFixed(6),Bottom:lat_min.toFixed(6),Right:lon_max.toFixed(6),Top:lat_max.toFixed(6)}
})
console.log('全部圖磚'+range.length+'個')

function seven11(Arr){done++;console.log('執行seven11()')
 var threads=0,result=[]
 post(Arr)
 function post(arr){
  if(!arr.length)return
  const obj=arr[0]
  threads++
  let str=`x1=${obj.Left}&y1=${obj.Bottom}&x2=${obj.Right}&y2=${obj.Top}`
  str=str.replace(/\./g,"")
  const formData="commandid=Search0007&"+str
  var now=false;if(threads<10){now=true;arr.shift();post(arr)}
  const r=https.request('https://emap.pcsc.com.tw/EMapSDK.aspx',
          {method:'POST',headers:{/*'Content-Length':formData.length,*/'Content-Type':'application/x-www-form-urlencoded'}},//該伺服器可不需Content-Length請求頭，Buffer.byteLength(formData)較formData.length保險，因utf-8或中文字的關係
          function(response){
           if(response.statusCode!=200){console.log('statusCode:',response.statusCode,formData);arr.push(obj)}
           var chunks=[]
           response.on('data',chunk=>chunks.push(chunk))
           response.on('end',()=>{
            const matches=Buffer.concat(chunks).toString('utf8').match(/<GeoPosition>[\s\S]*?<\/GeoPosition>/g)//?非貪婪，matches為null或1個以上陣列
            //\s匹配所有屬於空白類的字符、\S匹配所有屬於非空白類的字符，因此[\s\S]可以處理跨行的內容，較為保險
            //const geoPositions=matches||[]//若matches是null則為[]
            if(matches){//matches是null不處理
             const tags=['POIName','X','Y','TelNo','Address']
             matches.forEach((item,index)=>{
              const json={}
              tags.forEach(tag=>{
               try{json[tag]=item.split(`<${tag}>`)[1].split(`</${tag}>`)[0].trim()}catch(e){json[tag]=''}
              })
              matches[index]=json
             })
             console.log(`請求第${obj.Index}個圖磚`,matches)
             result.push(...matches)//使用擴展運算子展開matches並新增到result
            }
            threads--
            if(!now){arr.shift();post(arr)}//arr.shift()去除陣列的第一個元素
            if(!arr.length&&!threads)push(result)
           })
          }).on('error',e=>console.log('POST請求seven11失敗',e))
  r.write(formData)
  r.end()
 }
 function push(arr){
  const apiUrl='https://api.github.com/repos/wbjon/wbjon.github.io/contents/osm/seven11.osm'
  https.get(apiUrl,{headers:{'User-Agent':'node.js'}},res=>{
   var chunks=[]
   res.on('data',chunk=>chunks.push(chunk))
   res.on('end',()=>{
    try{var sha=JSON.parse(Buffer.concat(chunks).toString('utf8')).sha}catch(e){console.log('獲取sha錯誤',e);return};if(!sha){console.log('無sha');return}
    let str="<osm version='0.6'>",num=-1
    arr.forEach((item,index)=>{
     if(arr.slice(0,index).find(prevItem=>prevItem.POIName==item.POIName)){console.log(item.POIName,'重複');return}//加入重複點位的判斷
   //if(arr[index-1]&&item.POIName==arr[index-1].POIName)return
     str+=
`<node id='${num--}' lat='${item.Y}' lon='${item.X}'><tag k='seven11' v='${item.POIName}'/><tag k='TelNo' v='${item.TelNo}'/><tag k='Address' v='${item.Address}'/></node>`
    })
    console.log(`seven11共${-num-1}家`)
    const requestData=JSON.stringify({message:'seven11'+`共${-num-1}家_`+new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}),content:Buffer.from(str+"</osm>").toString('base64'),sha:sha})
    const req=https.request(apiUrl,{method:'PUT',headers:{'User-Agent':'node.js',Authorization:'token '+token/*,'Content-Type':'application/json','Content-Length': Buffer.byteLength(requestData)*/}}//Content-Type、Content-Length忽略無妨
                                  ,res=>{console.log('seven11已更新，PUT請求碼:'+res.statusCode);done--}
    ).on('error',e=>console.log('PUT請求github更新失敗',e))
    req.write(requestData)
    req.end()
   })
  }).on('error',e=>console.log('GET請求github_sha失敗',e))
 }
}//seven11(Arr)

function FamilyMart(Arr){done++;console.log('執行FamilyMart()')
 var threads=0,result=[]
 get(Arr)
 function get(arr){
  if(!arr.length)return
  const obj=arr[0]
  threads++
  var now=false;if(threads<1){now=true;arr.shift();get(arr)}
  https.get(`https://api.map.com.tw/net/familyShop.aspx?l=9&searchType=ShowStore&type=&vLeft=${obj.Left}&vRight=${obj.Right}&vTop=${obj.Top}&vBottom=${obj.Bottom}&fun=addSmallShop&key=6F30E8BF706D653965BDE302661D1241F8BE9EBC`,
            {headers:{referer:'https://www.family.com.tw/'}},
  function(response){
   if(response.statusCode!=200){console.log(`請求第${obj.Index}個圖磚`,'statusCode:',response.statusCode,obj);arr.push(obj)}
   var chunks=[]
   response.on('data',chunk=>chunks.push(chunk))
   response.on('end',()=>{
    const tmp=Buffer.concat(chunks).toString('utf8').match(/addSmallShop\(([\s\S]+)\)/)//不匹配會null，匹配會至少兩個元素陣列
    const matches=tmp&&JSON.parse(tmp[1])
    if(matches&&matches.length){//matches是null或[]不處理
     const tags=['NAME','px','py','TEL','addr']
     matches.forEach((item,index)=>{
      const json={}
      tags.forEach(tag=>json[tag]=item[tag])
      matches[index]=json
     })
     console.log(`請求第${obj.Index}個圖磚`,matches)
     result.push(...matches)//使用擴展運算子展開matches並新增到result
    }
    threads--
    if(!now){arr.shift();get(arr)}//arr.shift()去除陣列的第一個元素
    if(!arr.length&&!threads){console.log('FamilyMart間數',result.length);done--}//push(result)
   })
  }).on('error',e=>console.log('GET請求FamilyMart失敗',e))
 }

}//FamilyMart()

