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

var scaleR = d3.scale.sqrt().domain([0, 10]).range([15, 100]);

//TODO: customize the force layout
var force = d3.layout.force()
    .charge(-20) //allows us to set repulsion(-)/attraction(+) - default = -30?
    .linkDistance(500) //represents how long the links should be in an ideal situation (equilibrium length) #s in pixel vals
                      //not strictly setting link length- just ideal value
    .gravity(0.5) //from 0-1, weak attraction so nodes don't fly too far from center of page. Center is always center of width/height of forcelayout
    //can implement grav centers for different kinds of nodes, or that don't center on the screen - look at this in a later exercise
    .size([width,height])
    .friction(.1);  //0-1, higher value --> faster node motion in response to forces


//Global scope variable for data
var data;

//Global scope variable for DOM selection of force layout nodes and links;
var nodes, links;

d3.json('data/force.json',function(err,d){

    console.log(d);

    force
        .nodes(d.nodes)//d is input object with 2 arrays: nodes, links d.nodes calls nodes array
        .links(d.links)
        .start()  //start the force layout
        //can customize the tick function to adjust the force layout behavior
        .on('tick', function(e){
            //tick tracks the behavior of the digram (how close to stable state) using e in function call
            //console.log(e.alpha); //when this gets to zero, the code has stabilized. When it gets there, nodes and links are fixed in place.
            //can set alpha manually - force.alpha(1) sets it back manually (same as force.start/force.resume)
            //force.alpha(0) freezes it, force.stop stops computation anytime force function is running.

            //update nodes and ticks attributes each time this is run. Anything that changes should go here!
            //nodes.attr('x', function(d) {return d.x})
            //    .attr('y', function(d){return d.y});

            nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            links.attr('x1',function(d){return d.source.x})
                .attr('y1',function(d){return d.source.y})
                .attr('x2',function(d){return d.target.x})
                .attr('y2',function(d){return d.target.y});

            var q = d3.geom.quadtree(d.nodes),
                i = 0,
                n = d.nodes.length;

            while (++i < n) {
                q.visit(collide(d.nodes[i])); //calls collide function, which passes back updated values and boolean to indicate whether
                //updates occurred. q is a quadtree, which has a callback function visit that calls the collide function on each datapoint.
                //(see https://github.com/mbostock/d3/wiki/Quadtree-Geom)
            }

        }); //event listener to update as clock ticks (without this, no dynamic, iterative display)
        //all code that positions the links should happen inside the tick function!!


    //console.log(d.nodes); //force layout changes the existing array by adding attributes to it (x,y,value, weight, etc) for plotting on screen
   // console.log(d.links);  //new properties added to each element.
    //x,y are coordinates, px,py are previous x and y - value of x,y changes constantly.
    //links array stays the same (source, target, but source and target indices turn into objects that contain the data from the nodes array
    //Links stores x,y coords of source and link, so you can draw directly.

    //set up parameters for drawing (note that these do not include the dynamic features that use the forces)
    //set up outside of tick function so that there's something to access.
    var nodes = svg.selectAll('.node')
        .data(d.nodes)
        .enter()
        .append('g').attr('class','node');

    var nodeCircles = nodes
        .append('circle')
        //if you don't want it to bounce around as much, set x and y at the beginning - should stabilize
        // more smoothly if you start out close to the right value
        .attr('cx', 0)//function(d) {return d.x})
        .attr('cy', 0) //function(d){return d.y})
        .attr('r', function(d){ return scaleR(d.value)});

    //draw the nodes
    var nodeLabels = nodes
        .append('text')
        .attr('class', 'label')
        .attr('text-anchor', 'middle')
        .attr('x',0)
        .attr('y',0)
        .text(function(d){return d.name});
        //.attr('font-size', '10px');
        //.style('fill', 'rgb(235,235,235)');

    //grab all of the text labels, and call the wrap function to make sure that the text fits inside the bubble.
    nodes.selectAll('.label')
        //passes the data joined to the selection to the wrap function, along with a width value (here, set to a constant;
        //update later to adjust to the circle size)
        .call(wrap, 50);//function(d){console.log(scaleR(d.value)); return scaleR(d.value)}/2);

    //draw the links
    var links = svg.selectAll('.link')
        .data(d.links)
        .enter()
        .insert('line','.node')//like append, but inserting lines _before_ the nodes
        .attr('class','link');
});


function collide(dataPoint){
    //from assignment 6, modified to match variable names
    //define a variable with properties based on input data, return a function that stores comparator conditions to check
    //for collisions. That function returns true if modifications are necessary, and overwrites original data.

    //read original data x and y values, store x and y positions twice (presumably so that you can change nx1 and nx2 separately)
    var nr = scaleR(dataPoint.value) + 15,
        nx1 = dataPoint.x - nr,
        ny1 = dataPoint.y - nr,
        nx2 = dataPoint.x + nr,
        ny2 = dataPoint.y + nr;

    return function(quadPoint,x1,y1,x2,y2){
        //check whether the point is equal to the data point input. If so, take the difference between x and y values,
        //and the square root of a sum of squares (pythagorean theorem - does this calculate the difference in radius for the two objects?),
        //and a new radius value that's bigger than the radius of the initial data point.
        if(quadPoint.point && (quadPoint.point !== dataPoint)){
            var x = dataPoint.x - quadPoint.point.x,
                y = dataPoint.y - quadPoint.point.y,
                l = Math.sqrt(x*x+y*y),
                r = nr + scaleR(dataPoint.value);
            //if the radius is smaller than this sum, make the x values slightly bigger for both (why not y values also?)
            if(l<r){
                l = (l-r)/l*.1;
                dataPoint.x -= x*= (l*.05);
                dataPoint.y -= y*= l;
                quadPoint.point.x += (x*.05);
                quadPoint.point.y += y;
            }
        }
        //output the results, so that the x and y values of the new array are bigger than the minimum calculated by the collide function.
        return x1>nx2 || x2<nx1 || y1>ny2 || y2<ny1;  // asks if a collision is happening - checks whether x1>nx2 OR x2<nx1 (etc)
        //the result of the expression is a boolean; if any of these things is true, it returns true (checks to see if modified).

    }
}

//function to check the length of each line of text. If the line is too long, it will insert a span and create a new line
function wrap(text, width) {
    console.log(text);
    //from http://bl.ocks.org/mbostock/7555321

    //for each element in the data matrix bound to the selection
    text.each(function(d,i) {
        //save the text stored in the .name attribute
        var text = d3.select(this),//d[i].parentNode.__data__.name,
            //split the text into separate words by cutting at the spaces
            words = text.text().split(/\s+/).reverse(),
            //create some empty variables for later use
            word,
            line = [],
        //set the line number and height, values for y and change in y attributes
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
        //dy sets the positions of the tspan lines relative to one another; equivalent to a leading value
            dy = 0,//parseFloat(text.attr("dy")),
        //not 100% sure what this does; sets the text value to null, then appends a span with desired attributes
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        console.log(text[0][0]);
        //when you get to the last word in the words variable,
        while (word = words.pop()) {
            //put that word in the line array
            line.push(word);
            //and join the line array into a string, inserting a space
            tspan.text(line.join(" "));
            //.node returns the first non-null value in the array; compare its length with the width variable
            if (tspan.node().getComputedTextLength() > width) {
                //take the last element from the line array
                line.pop();
                //and add a space
                tspan.text(line.join(" "));
                //insert the value of the word variable(?)
                line = [word];
                //and adjust the text position using tspan, incrementing the line number and height appropriately
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
              }
        }
        text.attr('transform','translate(0,' + -lineNumber*lineHeight*4 + ')');

    });
}