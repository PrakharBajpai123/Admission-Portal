const mongoose =require('mongoose')


const Local_url = 'mongodb://127.0.0.1:27017/admissionportal';
const live_url = 'mongodb+srv://prakharbajpai8264:cbHIsj9RhUl5MsJz@cluster0.wzz9irf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

const connectDb = () =>{

    return mongoose.connect(live_url)

.then(()=>{

    console.log('connect db')

})
.catch((error)=>{

    console.log(error)
})


}


module.exports = connectDb