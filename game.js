// Game State
const gameState = {
    money: 1000,
    level: 1,
    day: 1,
    gameTime: 6,
    weather: 'sunny',
    field: Array(9).fill(null),
    animals: {},
    inventory: {
        wheat: 0,
        corn: 0,
        tomato: 0,
        carrot: 0
    },
    totalHarvested: 0,
    totalMoney: 1000
};

// Crop data
const crops = {
    wheat: { cost: 50, growthTime: 3, harvest: 150, icon: '🌾', name: 'قمح' },
    corn: { cost: 75, growthTime: 4, harvest: 200, icon: '🌽', name: 'ذرة' },
    tomato: { cost: 60, growthTime: 3, harvest: 180, icon: '🍅', name: 'طماطم' },
    carrot: { cost: 55, growthTime: 3, harvest: 160, icon: '🥕', name: 'جزر' }
};

// Animal data
const animals = {
    cow: { cost: 200, production: 100, icon: '🐄', name: 'بقرة', frequency: 2 },
    chicken: { cost: 100, production: 50, icon: '🐔', name: 'دجاجة', frequency: 1 },
    pig: { cost: 150, production: 80, icon: '🐷', name: 'خنزير', frequency: 2 },
    sheep: { cost: 120, production: 60, icon: '🐑', name: 'خروف', frequency: 1 }
};

// Market prices
const marketPrices = {
    wheat: 100,
    corn: 150,
    tomato: 120,
    carrot: 110
};

// Initialize game
function init() {
    gameState.animals = {
        cow: 0,
        chicken: 0,
        pig: 0,
        sheep: 0
    };
    renderFarm();
    updateUI();
}

// Render farm field
function renderFarm() {
    const farmField = document.getElementById('farmField');
    farmField.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'farm-cell';
        
        if (!gameState.field[i]) {
            cell.className += ' empty';
            cell.textContent = '➕';
            cell.onclick = () => showPlantOptions(i);
        } else {
            const cropData = gameState.field[i];
            const progress = cropData.age / cropData.growthTime;
            
            if (progress < 0.33) {
                cell.textContent = '🌱';
            } else if (progress < 0.67) {
                cell.textContent = '🌿';
            } else if (progress < 1) {
                cell.textContent = cropData.icon;
            } else {
                cell.className += ' ready';
                cell.textContent = '✨' + cropData.icon + '✨';
                cell.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.6)';
            }
            
            cell.title = `${cropData.name} - سن: ${cropData.age}/${cropData.growthTime}`;
            cell.onclick = () => harvestCrop(i);
        }
        
        farmField.appendChild(cell);
    }
}

// Plant crop
function plantCrop(cropType) {
    const cropData = crops[cropType];
    
    if (gameState.money < cropData.cost) {
        showNotification('لا توجد أموال كافية! 💸', 'error');
        return;
    }
    
    const emptyCell = gameState.field.findIndex(cell => cell === null);
    
    if (emptyCell === -1) {
        showNotification('لا توجد خلايا فارغة! اجمع المحاصيل أولاً! 🌾', 'error');
        return;
    }
    
    gameState.money -= cropData.cost;
    gameState.field[emptyCell] = {
        type: cropType,
        icon: cropData.icon,
        name: cropData.name,
        age: 0,
        growthTime: cropData.growthTime,
        harvest: cropData.harvest
    };
    
    showNotification(`تم زراعة ${cropData.name}! 🌱`, 'success');
    renderFarm();
    updateUI();
}

// Harvest crop
function harvestCrop(index) {
    const crop = gameState.field[index];
    
    if (!crop) return;
    
    if (crop.age >= crop.growthTime) {
        gameState.money += crop.harvest;
        gameState.inventory[crop.type]++;
        gameState.totalHarvested++;
        gameState.field[index] = null;
        
        showNotification(`تم حصاد ${crop.name}! 💰 +${crop.harvest}`, 'success');
        checkLevelUp();
        renderFarm();
        updateUI();
    } else {
        showNotification('المحصول لم ينضج بعد! ⏳', 'error');
    }
}

// Harvest all mature crops
function harvestAll() {
    let harvested = 0;
    
    gameState.field.forEach((crop, index) => {
        if (crop && crop.age >= crop.growthTime) {
            harvestCrop(index);
            harvested++;
        }
    });
    
    if (harvested === 0) {
        showNotification('لا توجد محاصيل جاهزة للحصاد! ⏳', 'error');
    } else {
        showNotification(`تم حصاد ${harvested} محاصيل! 🎉`, 'success');
    }
}

// Buy animal
function buyAnimal(animalType) {
    const animalData = animals[animalType];
    
    if (gameState.money < animalData.cost) {
        showNotification('لا توجد أموال كافية! 💸', 'error');
        return;
    }
    
    gameState.money -= animalData.cost;
    gameState.animals[animalType]++;
    
    showNotification(`تم شراء ${animalData.name}! 🎉`, 'success');
    updateUI();
}

// Feed animals
function feedAnimals() {
    let totalAnimals = Object.values(gameState.animals).reduce((a, b) => a + b, 0);
    
    if (totalAnimals === 0) {
        showNotification('لا توجد حيوانات لإطعامها! 🐾', 'error');
        return;
    }
    
    const feedCost = totalAnimals * 20;
    
    if (gameState.money < feedCost) {
        showNotification('لا توجد أموال كافية لإطعام الحيوانات! 💸', 'error');
        return;
    }
    
    gameState.money -= feedCost;
    showNotification(`تم إطعام ${totalAnimals} حيوانات! 🍽️`, 'success');
    updateUI();
}

// Advance day
function advanceDay() {
    gameState.day++;
    gameState.gameTime = (gameState.gameTime + 1) % 24;
    
    // Grow crops
    gameState.field.forEach(crop => {
        if (crop) crop.age++;
    });
    
    // Animal production
    let animalMoney = 0;
    for (const [animalType, count] of Object.entries(gameState.animals)) {
        if (count > 0) {
            const production = animals[animalType].production * count;
            animalMoney += production;
        }
    }
    
    if (animalMoney > 0) {
        gameState.money += animalMoney;
        showNotification(`الحيوانات أنتجت: +${animalMoney} 💰`, 'success');
    }
    
    // Random weather change
    const weatherTypes = ['sunny', 'rainy', 'cloudy'];
    gameState.weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    checkLevelUp();
    renderFarm();
    updateUI();
}

// Level up system
function checkLevelUp() {
    const newLevel = Math.floor(gameState.totalHarvested / 10) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.money += 500; // Bonus money
        showNotification(`🎉 تم الترقية للمستوى ${gameState.level}! +500 💰`, 'success');
    }
}

// Open market
function openMarket() {
    const modal = document.getElementById('marketModal');
    const marketItems = document.getElementById('marketItems');
    marketItems.innerHTML = '';
    
    for (const [cropType, quantity] of Object.entries(gameState.inventory)) {
        if (quantity > 0) {
            const price = marketPrices[cropType];
            const cropData = crops[cropType];
            
            const item = document.createElement('div');
            item.className = 'market-item';
            item.innerHTML = `
                <div>${cropData.icon}</div>
                <div><strong>${cropData.name}</strong></div>
                <div>عدد: ${quantity}</div>
                <div class="price">${price} 💰 للواحد</div>
                <button style="width: 100%; margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.3); border: none; border-radius: 5px; color: white; cursor: pointer; font-weight: bold;" onclick="sellCrop('${cropType}', ${quantity}, ${price})">بيع الكل</button>
            `;
            
            marketItems.appendChild(item);
        }
    }
    
    modal.classList.add('show');
}

// Sell crop
function sellCrop(cropType, quantity, pricePerUnit) {
    const totalPrice = quantity * pricePerUnit;
    gameState.money += totalPrice;
    gameState.inventory[cropType] = 0;
    gameState.totalMoney += totalPrice;
    
    showNotification(`تم بيع ${quantity} ${crops[cropType].name} بـ ${totalPrice} 💰`, 'success');
    closeMarket();
    updateUI();
}

// Close market
function closeMarket() {
    document.getElementById('marketModal').classList.remove('show');
}

// Update UI
function updateUI() {
    // Update header info
    document.getElementById('money').textContent = gameState.money;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('day').textContent = gameState.day;
    document.getElementById('gameTime').textContent = String(gameState.gameTime).padStart(2, '0') + ':00';
    
    // Update weather
    const weatherText = {
        sunny: 'مشمس',
        rainy: 'ممطر',
        cloudy: 'غائم'
    };
    
    const weatherIcon = {
        sunny: '☀️',
        rainy: '🌧️',
        cloudy: '☁️'
    };
    
    document.getElementById('weather').textContent = weatherText[gameState.weather];
    document.getElementById('weather-icon').textContent = weatherIcon[gameState.weather];
    
    // Update inventory
    const cropsInventory = document.getElementById('cropsInventory');
    cropsInventory.innerHTML = '';
    
    for (const [cropType, quantity] of Object.entries(gameState.inventory)) {
        if (quantity > 0) {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `<span>${crops[cropType].icon} ${crops[cropType].name}</span><strong>${quantity}</strong>`;
            cropsInventory.appendChild(item);
        }
    }
    
    if (cropsInventory.children.length === 0) {
        cropsInventory.innerHTML = '<p style="color: #999; text-align: center;">لا توجد محاصيل</p>';
    }
    
    // Update animals
    const animalsInventory = document.getElementById('animalsInventory');
    animalsInventory.innerHTML = '';
    
    for (const [animalType, quantity] of Object.entries(gameState.animals)) {
        if (quantity > 0) {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `<span>${animals[animalType].icon} ${animals[animalType].name}</span><strong>${quantity}</strong>`;
            animalsInventory.appendChild(item);
        }
    }
    
    if (animalsInventory.children.length === 0) {
        animalsInventory.innerHTML = '<p style="color: #999; text-align: center;">لا توجد حيوانات</p>';
    }
    
    // Update stats
    const stats = document.getElementById('stats');
    stats.innerHTML = `
        <div class="stat-item">
            <span>إجمالي المحاصيل المجموعة:</span>
            <strong>${gameState.totalHarvested}</strong>
        </div>
        <div class="stat-item">
            <span>إجمالي المال المكتسب:</span>
            <strong>${gameState.totalMoney}</strong>
        </div>
        <div class="stat-item">
            <span>المال الحالي:</span>
            <strong>${gameState.money}</strong>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type === 'error' ? 'error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show plant options
function showPlantOptions(index) {
    // Placeholder - can be enhanced with a modal
    console.log('Select crop for cell', index);
}

// Reset game
function resetGame() {
    if (confirm('هل تريد فعلاً إعادة تعيين اللعبة؟ ⚠️')) {
        gameState.money = 1000;
        gameState.level = 1;
        gameState.day = 1;
        gameState.gameTime = 6;
        gameState.field = Array(9).fill(null);
        gameState.animals = { cow: 0, chicken: 0, pig: 0, sheep: 0 };
        gameState.inventory = { wheat: 0, corn: 0, tomato: 0, carrot: 0 };
        gameState.totalHarvested = 0;
        gameState.totalMoney = 1000;
        
        showNotification('تم إعادة تعيين اللعبة! 🔄', 'success');
        renderFarm();
        updateUI();
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('marketModal');
    if (event.target === modal) {
        modal.classList.remove('show');
    }
});

// Initialize game on load
window.addEventListener('DOMContentLoaded', init);
