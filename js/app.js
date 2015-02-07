
var goalTemplate = "<td><span class='date'><%-date%></span><input type='text' class='date-input form-control hidden' value='<%-date%>'></td>"
					+"<td><span class='title'><%-title%></span><input type='text' class='title-input form-control hidden' value='<%-title%>'></td>"
					+"<td><a href='#' class='btn delete btn-warning'>X</a></td>";

var addTemplate = "<form id='goal-form'>"
					+"<div class='form-group'>"
						+"<label for='date' class='control-label'>Date:</label>"
						+"<input type='text' class='form-control' name='date' value='<%-date%>'>"
					+"</div>"
					+"<div class='form-group'>"
						+"<label for='title' class='control-label'>Goal:</label>"
						+"<input type='text' class='form-control' name='title' id='title'>"
					+"</div>"
				+"</form>";

var todoTemplate = "<td class='<%= done ? 'checked' : '' %>'><span class='title'><%-title%></span><input type='text' class='title-input form-control hidden' value='<%-title%>'></td>"
					+"<td><a href='#' class='btn check btn-success'><%= done ? 'O' : '&#10003' %></a></td>"
					+"<td><a href='#' class='btn delete btn-warning'>X</a></td>";


//Used to turn Form data into JSON
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


//------------------------------------------------------------------Goal

//	Goal Model
var Goal = Backbone.Model.extend({
	defaults:{
		date:'12/31/2014',
		title:'I pooped today'
	}
});

//	Goals Collection
var Goals = Backbone.Collection.extend({
	model:Goal,
	localStorage: new Store("backbone-goals")
});

//	Initialize Goals Collection
var goals = new Goals();

//	Single Goal View
var GoalView = Backbone.View.extend({
	tagName:'tr',
	initialize: function(){
		this.model.on('change',this.render,this);
	},
	template:_.template(goalTemplate),
	render:function(){
		var attr = this.model.toJSON();
		this.$el.html(this.template(attr));
		return this;
	},
	events:{
		'click span':'edit',
		'blur input': 'saveInput',
		'keypress input': 'updateOnEnter',
		'click .delete' : 'deleteItem'
	},
	edit: function(obj){
		var elem = this.$el;

		if(obj.currentTarget.className === 'date'){
			elem.find('.date').hide();
			var input = elem.find('.date-input');
			input.removeClass('hidden');
			input.focus();
		}else{
			elem.find('.title').hide();
			var input = elem.find('.title-input');
			input.removeClass('hidden');
			input.focus();
		}
	},
	saveInput:function(obj){
		var elem = this.$el;
		var saveValue;

		if(obj.currentTarget.className === 'date-input form-control'){
			elem.find('.date').show();
			var input = elem.find('.date-input');
			input.addClass('hidden');
			saveValue = {date:input.val()};
		}else if(obj.currentTarget.className === 'title-input form-control'){
			elem.find('.title').show();
			var input = elem.find('.title-input');
			input.addClass('hidden');
			saveValue = {title:input.val()};
		}
		this.model.save(saveValue);
	},
	updateOnEnter:function(e){
		if(e.keyCode===13){
			this.saveInput(e);
		}
	},
	deleteItem:function(){
		this.model.destroy();
	}
});

//	Main Goal List View
var GoalsView = Backbone.View.extend({
	el:'.main-goals',
	initialize:function(){
		this.collection.on('add',this.addOne,this);
		this.collection.on('remove',this.render,this);
		goals.fetch();
	},
	render:function(){
		this.$el.find('.goals tr').remove();
		this.collection.forEach(this.addOne,this);
	},
	addOne:function(goal){
		var goalView = new GoalView({model:goal});
		this.$('.goals').append(goalView.render().el);
		goal.save();
	},
	events:{
		"click .add":"addNew",
		"click .clear":"clearAll",
		"keypress .goal-input":"addOnEnter"
	},
	addNew: function(){
		$('#add-modal').modal('show');
		addView.render();
	},
	clearAll:function(){
		var model;
		while(model = this.collection.first()){
			model.destroy();
		}
	},
	addOnEnter:function(e){
		if(e.keyCode === 13){
		var today = new Date();
		var date = today.toDateString();
		var model = new Goal({title:(e.currentTarget.value).toString(),date:date});
		goals.add(model);
		e.currentTarget.value = '';
		}
	}
});

//	Initialize Main Goal List View
var mainView = new GoalsView({collection:goals});

//	Add Menu View
var AddView = Backbone.View.extend({
	el:'#add-modal',
	initialize:function(){
		this.render();
	},
	template:_.template(addTemplate),
	render:function(){
		var today = new Date();
		var date = {date:today.toDateString()};
		this.$el.find('#add-dialog').html(this.template(date));
		return this;
	},
	events:{
		"click .save": "addGoal"
	},
	addGoal: function(ev){
		var form = this.$('#goal-form');
		var details = form.serializeObject();
		var goal = new Goal(details);
		goals.add(goal);

		form.find('input[type=text]').val("");
		this.$el.modal('hide');
	}
});

//	Initialize Add Menu View
var addView = new AddView();


//-----------------------------------------------------------------Todo


var Todo = Backbone.Model.extend({
	defaults:{
		title:'todo item',
		done:false
	},
	toggle:function(){
		this.save({done: !this.get('done')});
	}
});

var Todos = Backbone.Collection.extend({
	model:Todo,
	localStorage: new Store("backbone-todos"),
	done:function(){
		return this.where({done:true});
	}
});

var todos = new Todos();

var TodoView = GoalView.extend({	// Just inherit the GoalView because it's basically the same except for template and event.
	template:_.template(todoTemplate),
	events:{
		'click span':'edit',
		'blur input': 'saveInput',
		'keypress input': 'updateOnEnter',
		'click .delete' : 'deleteItem',
		'click .check' :'toggleCheck'
	},
	toggleCheck:function(){
		this.model.toggle();
	}
}); 


var TodosView = Backbone.View.extend({
	el:'.main-todo',
	initialize:function(){
		this.collection.on('add',this.addOne,this);
		this.collection.on('remove',this.render,this);
		todos.fetch();
	},
	render:function(){
		this.$el.find('.todos tr').remove();
		this.collection.each(this.addOne,this);
	},
	addOne:function(todo){
		var todoView = new TodoView({model:todo});
		this.$el.find('.todos').append(todoView.render().el);
		todo.save();
	},
	events:{
		'keypress .todo-input':'addItem',
		'click .clear':'clearCompleted'
	},
	addItem:function(e){
		if(e.keyCode === 13){
			var model = new Todo({title:(e.currentTarget.value).toString(),done:false});
			todos.add(model);
			e.currentTarget.value = '';
		}
	},
	clearCompleted:function(){
		_.invoke(todos.done(),'destroy');
		return false;
	}
});

var todosView = new TodosView({collection:todos});

//	Router
var Router = Backbone.Router.extend({
	routes:{
		'':'main'
	}
});

var router = new Router();
Backbone.history.start();
