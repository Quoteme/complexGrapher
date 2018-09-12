math.import({
    sigma: function(start, end, whatToSum){
        if (end==math.Infinity || end=="Infinity" || end==Infinity) {
            end = 1000;
        }
        var sum = math.complex(0,0);
        for (var i = start; i <= end; i++){
            sum = math.add(sum,whatToSum(i));
        };
        return sum;
    },
    riemannZeta: function(s,limit) {
        return math.sigma(1,limit,function(n) {
            return math.divide(1,math.pow(n,s));
        })
    },
    percentage: function(x,a,b) {
        // returns the percentage that x represents between a and b
        return (x-a)/(b-a);
    }
})
