const moment = require('moment');
const mongoose = require('mongoose');
const {DateTime} = require('luxon');


const Schema = mongoose.Schema;
const AuthorSchema = new Schema({
    first_name: { type: String, required: true, max: 100 },
    family_name: { type: String, required: true, max: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date }
});

AuthorSchema.virtual('date_of_birth_formatted').get(() => {
    //return this.date_of_birth ? moment(this.date_of_birth).format('MMMM Do, YYYY') : '';
    return this.date_of_birth ? '' : moment(this.date_of_birth).format('MMMM Do, YYYY');
});

AuthorSchema.virtual('date_of_death_formatted').get(() => {
    return this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : '';
});

//虚拟属性'name'表示做着全名
AuthorSchema.virtual('name').get(function () {
    return this.family_name + ',' + this.first_name;
});

//虚拟属性lifespan做着寿命
AuthorSchema.virtual('lifespan').get(() => {
    let lefttime_stirng = '';
    if(this.date_of_death){
        lefttime_stirng = Datetime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);
    }
    lefttime_stirng +=' - ';
    if(this.date_of_death){
        lefttime_stirng += Datetime.fromJSDate(this.date_of_death).toLocaleString(Datetime.DATE_MED);
    }
    return lefttime_stirng;
});

//虚拟属性url 作者url
AuthorSchema.virtual('url').get(function () {
    return '/catalog/author/' + this._id;
});


AuthorSchema.virtual('date_of_birth_yyyy_mm_dd').get(function(){
    return DateTime.fromJSDate(this.date_of_death).toISODate();
});

module.exports = mongoose.model('Author', AuthorSchema);