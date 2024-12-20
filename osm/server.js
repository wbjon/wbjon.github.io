//網址：https://hubpush.glitch.me/?token=金鑰
var token,message="startTime:"+new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})
const http=require('http'),https=require('https'),fs=require('fs')
http.createServer((req,res)=>{
 if(req.url=="/"){res.writeHead(200,{'content-type':'text/plain;charset=utf-8','access-control-allow-origin':'*'});res.end(message);return}
 if(req.url=="/favicon.ico"){res.end();return}
 const tmp=req.url.match(/^\/\?token=(.+)/)
 if(tmp){token=tmp[1];res.end(token);range(fs.readFileSync('All15.xy','utf-8').split('\n'));return}
 res.end('others')
}).listen(8080)

function range(arr){//共30526個
 const power2=Math.pow(2,15)
 arr.forEach((item,index)=>{
  item=item.split('/')
  const x=+item[0],y=+item[1]
  const lon_min=360*x/power2-180,lon_max=360*(x+1)/power2-180
  let n
  n=Math.PI*(1-2*y/power2);const lat_max=Math.atan((Math.exp(n)-Math.exp(-n))/2)*180/Math.PI
  n=Math.PI*(1-2*(y+1)/power2);const lat_min=Math.atan((Math.exp(n)-Math.exp(-n))/2)*180/Math.PI
  let str=`x1=${lon_min.toFixed(6)}&y1=${lat_min.toFixed(6)}&x2=${lon_max.toFixed(6)}&y2=${lat_max.toFixed(6)}`
  str=str.replace(/\./g,"")
  arr[index]=str
 })
 console.log('全部圖磚'+arr.length+'個')
 post(arr)
}

var num=0,result=[],threads=0
function post(arr){
 if(!arr.length)return
 threads++
 const formData="commandid=Search0007&"+arr[0]
 var now=false;if(threads<10){now=true;arr.shift();post(arr)}
 const r=https.request('https://emap.pcsc.com.tw/EMapSDK.aspx',
         {method:'POST',headers:{/*'Content-Length':formData.length,*/'Content-Type':'application/x-www-form-urlencoded'}},//該伺服器可不需Content-Length請求頭，Buffer.byteLength(formData)較formData.length保險，因utf-8或中文字的關係
         function(response){num++
          var chunks=[]
          response.on('data',chunk=>{chunks.push(chunk)})
          response.on('end',()=>{
           const matches=Buffer.concat(chunks).toString('utf8').match(/<GeoPosition>[\s\S]*?<\/GeoPosition>/g)//?非貪婪，matches為null或1個以上陣列
           //\s匹配所有屬於空白類的字符、\S匹配所有屬於非空白類的字符，因此[\s\S]可以處理跨行的內容，較為保險
           //const geoPositions=matches||[]//若matches是null則為[]
           if(matches){//matches是null不處理
            const tags=['POIID','POIName','X','Y','TelNo','Address']
            matches.forEach((item,index)=>{
             const obj={}
             tags.forEach(tag=>{
              try{obj[tag]=item.split(`<${tag}>`)[1].split(`</${tag}>`)[0].trim()}catch(e){obj[tag]=''}
             })
             matches[index]=obj
            })
            console.log(`請求第${num}個圖磚`,matches)
            result.push(...matches)//使用擴展運算子展開matches並新增到result
           }
           threads--
           if(!now){arr.shift();post(arr)}//arr.shift()去除陣列的第一個元素
           if(!arr.length&&!threads){console.log(`7-Eleven共${result.length}家`);push(result)}
          })
         }).on('error',e=>console.log('POST請求7-Eleven失敗',e))
 r.write(formData)
 r.end()
}

function push(arr){
 const apiUrl='https://api.github.com/repos/wbjon/wbjon.github.io/contents/osm/7-Eleven.osm'
 https.get(apiUrl,{headers:{'User-Agent':'node.js'}},res=>{
  var chunks=[]
  res.on('data',chunk=>chunks.push(chunk))
  res.on('end',()=>{
   try{var sha=JSON.parse(Buffer.concat(chunks).toString('utf8')).sha}catch(e){console.log('獲取sha錯誤',e);return};if(!sha){console.log('無sha');return}
   let str="<osm version='0.6'>"
   arr.forEach((item,index)=>{index=-index-1
    str+=
`<node id='${index}' lat='${item.Y}' lon='${item.X}'><tag k='Eleven-7' v='${item.POIName}'/><tag k='TelNo' v='${item.TelNo}'/><tag k='Address' v='${item.Address}'/></node>`
   })
   updateFile(str+"</osm>",sha)
  })
 }).on('error',e=>console.log('GET請求github_sha失敗',e))

 function updateFile(data,sha){
  const requestData=JSON.stringify({message:'7-Eleven_'+`共${result.length}家_`+new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}),content:Buffer.from(data).toString('base64'),sha:sha})
  const req=https.request(apiUrl,{method:'PUT',headers:{'User-Agent':'node.js',Authorization:'token '+token/*,'Content-Type':'application/json','Content-Length': Buffer.byteLength(requestData)*/}}//Content-Type、Content-Length忽略無妨
                                ,res=>console.log('github已更新，PUT請求碼:'+res.statusCode)
  ).on('error',e=>console.log('PUT請求github更新失敗',e))
  req.write(requestData)
  req.end()
 }
}