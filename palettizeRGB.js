function palettizeRGB(block) {

	function colorDiff(colorA,colorB) {
		return Math.sqrt( (colorB[0] - colorA[0])**2 + (colorB[1]-colorA[1])**2 + (colorB[2]-colorA[2])**2 )
	}

	function colorLerp(colorA,colorB,mix) {
		return [ Math.round( colorB[0]*mix + colorA[0]*(1-mix) ),
			 Math.round( colorB[1]*mix + colorA[1]*(1-mix) ),
			 Math.round( colorB[2]*mix + colorA[2]*(1-mix) ) ]
	}

	// Pick two most contrasting colors
	var maxdiff = {'cA':0,'cB':0,'diff':0}
	for (var pixelA = 0; pixelA < block.length; pixelA+=3) {
		for (var pixelB = 0; pixelB < block.length; pixelB+=3) {
			let colorA = block.slice(pixelA,pixelA+3)
			let colorB = block.slice(pixelB,pixelB+3)
			let diff = colorDiff(colorA,colorB)
			if (diff > maxdiff.diff) { maxdiff = {'cA':colorA,'cB':colorB,'diff': diff } }
		}
	}

	// Lerp palette
	var palette = [
		maxdiff.cA,
		colorLerp(maxdiff.cA, maxdiff.cB, 0.25),
		colorLerp(maxdiff.cA, maxdiff.cB, 0.75),
		maxdiff.cB
        ]

	var enum_palette = palette.map((val,ind)=>{return [val,ind]})
	var out_index = [] // Initiate index output

	for (var pixel = 0; pixel < block.length; pixel+=3) {
		let color = block.slice(pixel,pixel+3)
		// Pick the closest color from the palette
		let optimalcolor = enum_palette.sort((a,b)=>{return colorDiff(color,a[0]) > colorDiff(color,b[0]) })[0][1] //[0][1] to get index of first item
		// Add to output
		out_index.push(optimalcolor)
	}

	return [
		[maxdiff.cA,maxdiff.cB],
		out_index
	]

}

export { palettizeRGB }
