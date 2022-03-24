addLayer("r", {
    name: "reality", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "R", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
    }},
    color: "#444444",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "scraps of reality", // Name of prestige currency
    baseResource: "possibilities", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
	getResetGain () {
		if (hasUpgrade('r',12)) {
			if (tmp[this.layer].baseAmount.lt(tmp[this.layer].requires)) {
				return decimalZero
			}
			let gain = tmp[this.layer].baseAmount.div(tmp[this.layer].requires).pow(tmp[this.layer].exponent).times(tmp[this.layer].gainMult).pow(tmp[this.layer].gainExp);
			if (gain.gte(tmp[this.layer].softcap)) {
				gain = gain.pow(tmp[this.layer].softcapPower).times(tmp[this.layer].softcap.pow(decimalOne.sub(tmp[this.layer].softcapPower)))
			}
			gain = gain.times(tmp[this.layer].directMult)
			return gain.floor().max(0);
		} else {
			if ((!tmp[this.layer].canBuyMax) || tmp[this.layer].baseAmount.lt(tmp[this.layer].requires)) {
				return decimalOne
			}
			let gain = tmp[this.layer].baseAmount.div(tmp[this.layer].requires).div(tmp[this.layer].gainMult).max(1).log(tmp[this.layer].base).times(tmp[this.layer].gainExp).pow(Decimal.pow(tmp[this.layer].exponent, -1))
			gain = gain.times(tmp[this.layer].directMult)
			return gain.floor().sub(player[this.layer].points).add(1).max(1);
		}
		return decimalOne;
	},
	getNextAt (canMax=false) {
		if (hasUpgrade('r',12)) {
			let next = this.getResetGain().add(1);
			next = next.div(tmp[this.layer].directMult);
			if (next.gte(tmp[this.layer].softcap)) next = next.div(tmp[this.layer].softcap.pow(decimalOne.sub(tmp[this.layer].softcapPower))).pow(decimalOne.div(tmp[this.layer].softcapPower))
			next = next.root(tmp[this.layer].gainExp).div(tmp[this.layer].gainMult).root(tmp[this.layer].exponent).times(tmp[this.layer].requires).max(tmp[this.layer].requires)
			if (tmp[this.layer].roundUpCost) next = next.ceil()
			return next;
		} else {
			if (!tmp[this.layer].canBuyMax) canMax = false
			let amt = player[this.layer].points.plus((canMax&&tmp[this.layer].baseAmount.gte(tmp[this.layer].nextAt))?tmp[this.layer].resetGain:0).div(tmp[this.layer].directMult)
			let extraCost = Decimal.pow(tmp[this.layer].base, amt.pow(tmp[this.layer].exponent).div(tmp[this.layer].gainExp)).times(tmp[this.layer].gainMult)
			let cost = extraCost.times(tmp[this.layer].requires).max(tmp[this.layer].requires)
			if (tmp[this.layer].roundUpCost) cost = cost.ceil()
			return cost;
		}
	},
    exponent: new Decimal(0.9), // Prestige currency exponent
	canBuyMax() { return this.goNormal; },
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
		if (hasUpgrade('r', 14)) mult = mult.times(upgradeEffect('r', 14))
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "r", description: "R: Reset for scraps of reality", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true},
	prestigeButtonText() {
		if (hasUpgrade('r',12)) {
			return `${player[this.layer].points.lt(1e3) ? (tmp[this.layer].resetDescription !== undefined ? tmp[this.layer].resetDescription : "Reset for ") : ""}+<b>${formatWhole(tmp[this.layer].resetGain)}</b> ${tmp[this.layer].resource} ${this.getResetGain().lt(100) && player[this.layer].points.lt(1e3) ? `<br><br>Next at ${(tmp[this.layer].roundUpCost ? formatWhole(tmp[this.layer].nextAt) : format(tmp[this.layer].nextAt))} ${tmp[this.layer].baseResource}` : ""}`
		} else {
			return `${tmp[this.layer].resetDescription !== undefined ? tmp[this.layer].resetDescription : "Reset for "}+<b>${formatWhole(tmp[this.layer].resetGain)}</b> ${tmp[this.layer].resource}<br><br>${player[this.layer].points.lt(30) ? (tmp[this.layer].baseAmount.gte(tmp[this.layer].nextAt) && (tmp[this.layer].canBuyMax !== undefined) && tmp[this.layer].canBuyMax ? "Next:" : "Req:") : ""} ${formatWhole(tmp[this.layer].baseAmount)} / ${(tmp[this.layer].roundUpCost ? formatWhole(tmp[this.layer].nextAtDisp) : format(tmp[this.layer].nextAtDisp))} ${tmp[this.layer].baseResource}`
		}
	},
	canReset() {
		if (hasUpgrade('r',12)) {
			return tmp[this.layer].baseAmount.gte(tmp[this.layer].requires);
			
		} else {
			return tmp[this.layer].baseAmount.gte(tmp[this.layer].nextAt);
		}
	},
	upgrades: {
		11: {
			title: "Reality Blossoming",
			description: "Doubles your possibilities.",
			cost: new Decimal(3),
		},
		12: {
			title: "Reality Anchoring",
			description: "Reality becomes far easier to gain.",
			cost: new Decimal(5),
		},
		13: {
			title: "Possibilities of Creation",
			description: "Scraps of Reality boost possibility gain.",
			effect() {
				return player[this.layer].points.add(1).pow(0.75)
			},
			effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
			cost: new Decimal(10),
		},
		14: {
			title: "Inspired Reality",
			description: "Swirling possibilities boost reality growth.",
			effect() {
				return player.points.add(1).pow(0.1)
			},
			effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
			cost: new Decimal(100),
		},
		21: {
			title: "Fruits of Reality",
			description: "Unlocks the Space and Time layers.",
			cost: new Decimal(1000),
			unlocked() {
				return player[this.layer].best.gte(700);
			},
			onPurchase() {
				player['t'].unlocked = true;
				player['s'].unlocked = true;
			},
		},
	},
	branches: ['t','s'],
	autoPrestige() {
		return (!hasUpgrade('r',12) && hasMilestone('t',1))
	},
	passiveGeneration() {
		if (hasUpgrade('r',12) && hasMilestone('t',1)) {
			return 1
		} else {
			return 0
		}
	},
})
addLayer("t", {
    name: "time", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "T", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
    }},
    color() {
		if(player[this.layer].best.gte(1) || (getResetGain(this.layer).gte(1) && hasUpgrade('r',21))) {
			return "#111199"
		} else {
			return "#CC9999"
		}
	},
    requires: new Decimal(2000), // Can be a function that takes requirement increases into account
	canReset() {
		return ((this.baseAmount().gte(this.requires)) && (hasUpgrade('r',21) || player[this.layer].points.gte(1)))
	},
    resource: "seconds of time", // Name of prestige currency
    baseResource: "scraps of reality", // Name of resource prestige is based on
    baseAmount() {return player['r'].points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: new Decimal(0.5), // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "t", description: "T: Reset for time.", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return player[this.layer].unlocked},
	upgrades: {
	},
	milestones: {
		0: {
			requirementDescription: "1 second of time",
			effectDescription() {
				return ("Possibilities occur to you faster the more time you have. Currently: "+player[this.layer].points.add(1).pow(0.5).toStringWithDecimalPlaces(2)+"x")
			},
			done() { return player[this.layer].best.gte(1) }
		},
		1: {
			requirementDescription: "5 seconds of time",
			effectDescription: "Automatically grow the fabric of reality.",
			done() { return player[this.layer].best.gte(5) }
		}
	},
})
addLayer("s", {
    name: "space", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "S", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
    }},
    color() {
		if(player[this.layer].points.gte(1) || (getResetGain(this.layer).gte(1) && hasUpgrade('r',21))) {
			return "#007700"
		} else {
			return "#CC9999"
		}
	},
    requires: new Decimal(2000), // Can be a function that takes requirement increases into account
	canReset() {
		return ((this.baseAmount().gte(this.requires)) && (hasUpgrade('r',21) || player[this.layer].points.gte(1)))
	},
    resource: "litres of space", // Name of prestige currency
    baseResource: "scraps of reality", // Name of resource prestige is based on
    baseAmount() {return player['r'].points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: new Decimal(0.5), // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "s", description: "S: Reset for space.", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return player[this.layer].unlocked},
	upgrades: {
	},
})