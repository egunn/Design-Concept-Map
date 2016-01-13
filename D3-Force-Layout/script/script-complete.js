//This example shows how nodes and links can be represented differently

var margin = {t:100,l:100,b:100,r:100},
    width = document.getElementById('plot').clientWidth-margin.l-margin.r,
    height = document.getElementById('plot').clientHeight-margin.t-margin.b;

var svg = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.l+margin.r)
    .attr('height',height+margin.t+margin.b)
    .append('g')
    .attr('transform',"translate("+margin.l+","+margin.t+")");

var force = d3.layout.force()
    .size([width,height])
    .linkStrength(.1) //rigidity of links
    .friction(0.9) //1-> frictionless
    .linkDistance(20) // weak geometric constraint
    .charge(-60) //negative value -> nodes repel each other
    .chargeDistance(100)
    .gravity(0) //
    .theta(0.8)
    .alpha(0.1);

//Global scope variable for data
var data;

//Global scope variable for DOM selection of force layout nodes and links;
var nodes, links;

d3.json('data/force.json',function(err,d){
    data = d;

    force
        .nodes(data.nodes)
        .links(data.links)
        .on('tick',onTick)

    draw();

    force.start();
});

function draw(){
    nodes = svg.selectAll('.node')
        .data(data.nodes)
        .enter()
        .append('g')
        .attr('class','node')
        .call(force.drag);
    nodes
        .append('rect')
        .attr('width',5)
        .attr('height',5)
        .attr('x',-2.5)
        .attr('y',-2.5);

    links = svg.selectAll('.link')
        .data(data.links)
        .enter()
        .insert('line','.node')
        .attr('class','link');
}

function onTick(){
    nodes
        .attr('transform',function(d){
            return 'translate('+ d.x + ',' + d.y + ')';
        })
    links
        .attr('x1',function(d){ return d.source.x })
        .attr('y1',function(d){ return d.source.y })
        .attr('x2',function(d){ return d.target.x })
        .attr('y2',function(d){ return d.target.y });
}