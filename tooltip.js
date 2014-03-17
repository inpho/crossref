$(document).ready(function(){
    $('.tooltip').mouseover(function(e){
        
        if( $(this).attr('data-tip-type') == 'text' ){
            $('#tooltip_container').html( $(this).attr('data-tip-source'));
        }
        
    }).mousemove(function(e){
        
    }).mouseout(function(e){
        
    });
    
});