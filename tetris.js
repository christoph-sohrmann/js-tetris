/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

WIDTH  = 10;
HEIGHT = 21;

document.title = 'TETRIS';

Array.prototype.rotate = function(n) {
    return this.slice(n, this.length).concat(this.slice(0, n));
}

String.prototype.pad = function(n) {
    var s = this;
    for (var i=0; i<n-this.length; i++) s = '0' + s;
    return s;
};

Array.prototype.remove = function(line, new_element) {
    this.splice(line,1);
    if (new_element!=null)
        this[HEIGHT-1] = new_element;
    else
        this[HEIGHT-1] = 0;
};

log = function (text) {
    $("#log").append(text + '<br/>');
}

log_clear = function () {
    $("#log").text("");
}

display = function(element) {
    remove_element(element);
    show_element(element);
    update_info();
}

remove_element = function(element) {
    $('*').removeClass(shape_names[element.shape_type]);
    $('*').removeClass("pixel2");
}

show_element = function(element) {
    var field = element.field;
    for (var y=0; y<HEIGHT; y++) {
        row = field.rows[y];
        if ((element!=null)&&(y>=element.y)&&(y<element.y+4)) {
            row = element.row(y-element.y) | row;
            for (var x=0; x<WIDTH; x++) {
                if (element.row(y-element.y) & (1<<x))
                    $('#fld_'+x+'_'+(HEIGHT-1-y)).addClass(shape_names[element.shape_type]);
            }
        }
    }
    for (var i=0; i<4; i++) {
        if (element.shape_set[0] & (34952>>i))
            $('div[id^="fld_'+(element.x-i+3)+'"]').addClass("pixel2");
    }
}

update_info = function () {
    $('#level').text(LEVEL);
    $('#lines').text(LINES);
    $('#points').text(POINTS);
    //$('#delay').text(DELAY);
}

update_level = function () {
    LEVEL = 1 + Math.floor(LINES/10);
    DELAY = 50+1500/(LEVEL+4);
}

refresh = function(field) {
    for (var y=0; y<HEIGHT; y++) {
        for (var x=0; x<WIDTH; x++) {
            color = '';
            if (field.rows[y] & (1<<x))
                color = shape_colors[field.types[y][x]];
            $('#fld_'+x+'_'+(HEIGHT-1-y)).css({"background-color": color});
        }
    }
}

remove_row = function (y) {
    //$('div[id$="_'+(HEIGHT-1-y)+'"]').hide('fast', function () { alert('done'); }); // animate({width: 'toggle', height: 'toggle'});
}

create_element = function (x, y, shape_type, field) {
    this.element = new Object();
    this.element.x = x;
    this.element.y = y;
    this.element.shape_set = shape_sets[shape_type];
    this.element.field = field;
    this.element.shape_type = shape_type;
    
    this.element.clear = function () {
        for (var i=0; i<HEIGHT; i++)
            this.row[i] = 0;        
    }
    
    this.element.rotate = function () {
        this.shape_set = this.shape_set.rotate(1);
        if (this.field.collision(this))
            this.shape_set = this.shape_set.rotate(-1);
        else
            display(this);
    }

    this.element.drop = function () {
        this.y--;
        if (this.field.collision(this)) {
            this.y++;
            this.field.put(this);
            return false;
        }
        display(this);
        if (accelerating)
            POINTS += LEVEL;
        return true;
    }
    
    this.element.row = function (y, dx) {
        if (dx==null) dx = 0;
        if (this.x+dx>=0)
            return (this.shape_set[0]>>(4*(y)) & 15)<<(this.x+dx);
        else
            return (this.shape_set[0]>>(4*(y)) & 15)>>-(this.x+dx);
    }

    this.element.shift_right = function () {
        this.x++;
        if (field.collision(this))
            this.x--;
        else
            display(el);
    }

    this.element.shift_left = function () {
        this.x--;
        if (field.collision(this))
            this.x++;
        else
            display(el);
    }

    if (field.collision(this.element))
        return null;
    else
        return this.element;
}

Field = function () {    
    this.rows = new Array();
    this.types = new Array();
    
    this.clear = function () {
        for (var y=0; y<HEIGHT; y++) {
            this.rows[y] = 0;
            this.types[y] = new Array();
        }
    }
    
    this.row = function (y) {
        if ((y>=0)&&(y<HEIGHT))
            return (this.rows[y]<<1) + Math.pow(2, WIDTH+1) + 1;
        else
            return Math.pow(2, WIDTH+2)-1;
    }

    this.collision = function (element) {
        var y = element.y;
        return ((this.row(y) & (element.row(0, 1))) +
                (this.row(y+1) & (element.row(1, 1))) +
                (this.row(y+2) & (element.row(2, 1))) +
                (this.row(y+3) & (element.row(3, 1)))) > 0;
    }
    
    this.put = function (element) {
        for (var i=0; i<4; i++) {
            this.rows[element.y+i] |= element.row(i);
            for (var x=0; x<WIDTH; x++)
                if (element.row(i) & (1<<x)) {
                    this.types[element.y+i][x] = element.shape_type;
                }
        }
        var LINES_REMOVED = 0;
        j = 0;
        for (var i=0; i<4; i++) {
            if (this.rows[element.y+j]==Math.pow(2, WIDTH)-1) {
                this.rows.remove(element.y+j);
                this.types.remove(element.y+j, new Array());
                remove_row(element.y+j);
                LINES_REMOVED++;
            } else j++;
        }
        LINES += LINES_REMOVED;
        POINTS += LINES_REMOVED*LINES_REMOVED*100;
        remove_element(element);
        refresh(field);
        update_level();
    }
    
    this.clear();
}

I_Shape = new Array(parseInt('0000111100000000', 2), parseInt('0100010001000100', 2));
J_Shape = new Array(parseInt('1000111000000000', 2), parseInt('0110010001000000', 2), parseInt('1110001000000000', 2), parseInt('0100010011000000', 2));
L_Shape = new Array(parseInt('0010111000000000', 2), parseInt('0100010001100000', 2), parseInt('1110100000000000', 2), parseInt('1100010001000000', 2));
O_Shape = [ 1632 ];
S_Shape = new Array(parseInt('0000011011000000', 2), parseInt('0100011000100000', 2));
T_Shape = new Array(parseInt('0100111000000000', 2), parseInt('0100011001000000', 2), parseInt('0000111001000000', 2), parseInt('0100110001000000', 2));
Z_Shape = new Array(parseInt('1100011000000000', 2), parseInt('0100110010000000', 2));
shape_sets = [I_Shape, J_Shape, L_Shape, O_Shape, S_Shape, T_Shape, Z_Shape];
shape_colors = [ '#28B5B0', '#2166B5', '#B59C38', '#EBE300', '#37B823', '#762AB8', '#B81F1F' ];
shape_names = ["I_Shape", "J_Shape", "L_Shape", "O_Shape", "S_Shape", "T_Shape", "Z_Shape"];
field = new Field();

// TODO:
// * korrekte Starthoehe
// * neue Elemente fluessiger hinzufuegen
// * links/rechts mit Verzoegerung 
// * Ende-Meldung
// * Highscore
// * Cookies
// * Settings (Zeiten, Tasten, Level etc.)
// * Zeile elegant entfernen
// * Element preview

LEVEL = 1;
ACCELERATED_DELAY = 20;
PAUSE = false;
LINES = 0;
POINTS = 0;
update_level();

set_handler = function () {
    $(document).keydown(keydown_event);
    $(document).keyup(keyup_event);
}

unset_handler = function () {
    $(document).unbind('keydown');
    $(document).unbind('keyup');
}

run = function () {
    window.setTimeout(dropping, DELAY);
}

dropping = function () {
    if (PAUSE) return;
    if ((el!=null) && (!el.drop())) {
        el = create_element(3, HEIGHT-4, Math.floor(Math.random()*shape_sets.length), field);
        if (el==null) {
            //alert("Finished.");
            return;
        }
        update_level();
    }
    run();
} 

load_event = function () {

    init_field();
    
    /*
    el = create_element(0, -2, 0, field); field.put(el);
    el = create_element(4, -2, 0, field); field.put(el);    
    el = create_element(6, 5, 2, field); el.rotate();/**/
    
    el = create_element(3, HEIGHT-4, Math.floor(Math.random()*shape_sets.length), field);
    //el = create_element(3, HEIGHT-4, 5, field);

    display(el);

    run();
}

accelerating = false;


//keyup_event = function (e) {
//    if (PAUSE && (e.which!=80)) return;
//    switch (e.which) {
//        case 40:
//            DELAY = DEFAULT_DELAY/LEVEL;
//            accelerating = false;
//            break;
//    }
//}

init_field = function () {    
    for (var y=0; y<HEIGHT; y++)
        for (var x=0; x<WIDTH; x++) {
            $("#field").append('<div class="pixel" id="fld_'+x+'_'+y+'">&nbsp;</div>');
            $('#fld_'+x+'_'+y).css('left', 100+x*($('#fld_'+x+'_'+y).width()+3));
            $('#fld_'+x+'_'+y).css('top', 100+y*($('#fld_'+x+'_'+y).height()+3));
        }
}

window.onload = load_event;
//set_handler();


// Keyboard input with customisable repeat (set to 0 for no key repeat)
//
function KeyboardController(keys_and_repeat) {
    // Lookup of key codes to timer ID, or null for no repeat
    //
    var timers= {};

    // When key is pressed and we don't already think it's pressed, call the
    // key action callback and set a timer to generate another one after a delay
    //
    document.onkeydown= function(event) {
        var key= (event || window.event).keyCode;
        if (!(key in keys_and_repeat))
            return true;
        if (!(key in timers)) {
            timers[key]= null;
            keys_and_repeat[key][0]();
            if (keys_and_repeat[key][2]!==0)
                timers[key]= setInterval(keys_and_repeat[key][0], keys_and_repeat[key][2]);
        }
        return false;
    };

    // Cancel timeout and mark key as released on keyup
    //
    document.onkeyup= function(event) {
        var key= (event || window.event).keyCode;
        if (key in timers) {
            if (timers[key]!==null)
                clearInterval(timers[key]);
            if (keys_and_repeat[key][1]!=null)
                keys_and_repeat[key][1]();
            delete timers[key];
        }
    };

    // When window is unfocused we may not get key events. To prevent this
    // causing a key to 'get stuck down', cancel all held keys
    //
    window.onblur= function() {
        for (key in timers)
            if (timers[key]!==null)
                clearInterval(timers[key]);
        timers= {};
    };
};

KeyboardController({
    39: [ function() {if (el!=null) el.shift_right();}, null, 100 ],
    37: [ function() {if (el!=null) el.shift_left();}, null, 100 ],
    
    32: [ function() {if (el!=null) el.rotate();}, null, 0 ],
    38: [ function() {if (el!=null) el.rotate();}, null, 0 ],
    
    80: [ function() {if (PAUSE) run();PAUSE = !PAUSE;}, null, 0 ],
    40: [ function() {if ((el!=null) && (el.drop())) {DELAY = ACCELERATED_DELAY; accelerating = true; display(el); }}, function () {update_level(); accelerating = false;}, 0 ]
});

//KeyboardController({
//}, 0);
