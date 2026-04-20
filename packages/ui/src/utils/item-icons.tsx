/**
 * Item Icon System mit Hugeicons
 * Einheitliche Icons für Inventar und Hotbar
 */

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    // Food & Drinks
    Hamburger01Icon,
    Pizza01Icon,
    HotdogIcon,
    NoodlesIcon,
    ChickenThighsIcon,
    FishFoodIcon,
    Coffee01Icon,
    DrinkIcon,
    SodaCanIcon,
    SoftDrink01Icon,

    // Medical
    FirstAidKitIcon,
    Medicine01Icon,
    PillsTabletIcon,
    InjectionIcon,
    BandageIcon,
    BloodBagIcon,

    // Clothing & Accessories
    TShirtIcon,
    Shirt01Icon,
    HoodieIcon,
    VestIcon,
    ShortsPantsIcon,
    RunningShoesIcon,
    ArmoredBootIcon,
    HatIcon,
    GlassesIcon,
    SunglassesIcon,
    MaskIcon,
    Watch01Icon,
    EarRings01Icon,
    Backpack01Icon,

    // Money & Cards
    Cash01Icon,
    Wallet01Icon,
    CreditCardIcon,

    // Documents
    File01Icon,
    InvoiceIcon,
    Agreement01Icon,

    // Phone & Electronics
    SmartphoneWifiIcon,

    // Keys & Security
    Key01Icon,

    // Tools & Equipment
    Settings01Icon,
    Wrench01Icon,
    Mic01Icon,

    // Vehicles & Fuel
    Car01Icon,
    FuelIcon,

    // Misc
    PackageIcon,
    Package01Icon,
} from '@hugeicons/core-free-icons';

// Type for Hugeicons
type IconSvgObject = ([string, { [key: string]: string | number }])[] | readonly (readonly [string, { readonly [key: string]: string | number }])[];

// ==================== ICON MAPPINGS ====================

/**
 * Icon Mapping für spezifische Item-Namen
 */
const ITEM_ICON_MAP: Record<string, IconSvgObject> = {
    // Money
    'cash': Cash01Icon,
    'money': Cash01Icon,
    'wallet': Wallet01Icon,
    'credit_card': CreditCardIcon,
    'ec_card': CreditCardIcon,
    'bank_card': CreditCardIcon,

    // Documents
    'id_card': Agreement01Icon,
    'license': Agreement01Icon,
    'driver_license': Agreement01Icon,
    'passport': File01Icon,
    'invoice': InvoiceIcon,

    // Phone
    'phone': SmartphoneWifiIcon,
    'smartphone': SmartphoneWifiIcon,
    'sim_card': CreditCardIcon,

    // Keys
    'key': Key01Icon,
    'car_key': Key01Icon,
    'house_key': Key01Icon,
    'vehicle_key': Key01Icon,

    // Radio
    'radio': Mic01Icon,
    'funkgeraet': Mic01Icon,
    'walkie_talkie': Mic01Icon,

    // Clothing - Torso
    'clothing_torso': TShirtIcon,
    'tshirt': TShirtIcon,
    'shirt': Shirt01Icon,
    'hoodie': HoodieIcon,
    'jacket': HoodieIcon,

    // Clothing - Undershirt
    'clothing_undershirt': Shirt01Icon,
    'undershirt': Shirt01Icon,

    // Clothing - Vest
    'clothing_vest': VestIcon,
    'vest': VestIcon,

    // Clothing - Legs
    'clothing_legs': ShortsPantsIcon,
    'pants': ShortsPantsIcon,
    'shorts': ShortsPantsIcon,
    'jeans': ShortsPantsIcon,

    // Clothing - Feet
    'clothing_feet': RunningShoesIcon,
    'shoes': RunningShoesIcon,
    'sneakers': RunningShoesIcon,
    'boots': ArmoredBootIcon,

    // Accessories
    'hat': HatIcon,
    'cap': HatIcon,
    'glasses': GlassesIcon,
    'sunglasses': SunglassesIcon,
    'mask': MaskIcon,
    'watch': Watch01Icon,
    'earrings': EarRings01Icon,
    'bracelet': Watch01Icon,
    'backpack': Backpack01Icon,
    'bag': Backpack01Icon,

    // Food
    'burger': Hamburger01Icon,
    'hamburger': Hamburger01Icon,
    'pizza': Pizza01Icon,
    'hotdog': HotdogIcon,
    'noodles': NoodlesIcon,
    'chicken': ChickenThighsIcon,
    'fish': FishFoodIcon,
    'sandwich': Hamburger01Icon,

    // Drinks
    'coffee': Coffee01Icon,
    'water': SoftDrink01Icon,
    'soda': SodaCanIcon,
    'cola': SodaCanIcon,
    'juice': DrinkIcon,
    'beer': DrinkIcon,
    'wine': DrinkIcon,
    'energy_drink': SodaCanIcon,

    // Medical
    'medkit': FirstAidKitIcon,
    'first_aid': FirstAidKitIcon,
    'bandage': BandageIcon,
    'pills': PillsTabletIcon,
    'medicine': Medicine01Icon,
    'painkiller': PillsTabletIcon,
    'syringe': InjectionIcon,
    'blood_bag': BloodBagIcon,

    // Tools
    'wrench': Wrench01Icon,
    'toolbox': Settings01Icon,
    'repair_kit': Settings01Icon,

    // Vehicle
    'fuel': FuelIcon,
    'gas': FuelIcon,
    'jerry_can': FuelIcon,

    // Tuning
    'engine': Settings01Icon,
    'brakes': Settings01Icon,
    'turbo': Settings01Icon,
    'suspension': Settings01Icon,
    'transmission': Settings01Icon,
};

/**
 * Icon Mapping für Item-Kategorien (Fallback)
 */
const CATEGORY_ICON_MAP: Record<string, IconSvgObject> = {
    'food': Hamburger01Icon,
    'drink': Coffee01Icon,
    'medical': FirstAidKitIcon,
    'drug': PillsTabletIcon,
    'weapon': Settings01Icon,  // No weapon icon in free pack
    'ammo': Package01Icon,
    'tool': Settings01Icon,
    'clothing': TShirtIcon,
    'accessory': Watch01Icon,
    'document': File01Icon,
    'electronic': SmartphoneWifiIcon,
    'radio': Mic01Icon,
    'container': Backpack01Icon,
    'key': Key01Icon,
    'vehicle': Car01Icon,
    'book': File01Icon,
    'fuel': FuelIcon,
    'tuning': Settings01Icon,
    'misc': PackageIcon,
    'money': Cash01Icon,
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Holt das Hugeicon für ein Item
 * @param iconName - Icon-Name aus Item-Definition
 * @param category - Item-Kategorie als Fallback
 * @returns Hugeicons IconSvgObject oder null
 */
export function getItemHugeIcon(iconName?: string, category?: string): IconSvgObject | null {
    // Erst nach spezifischem Icon suchen
    if (iconName && ITEM_ICON_MAP[iconName]) {
        return ITEM_ICON_MAP[iconName];
    }

    // Dann nach Kategorie suchen
    if (category && CATEGORY_ICON_MAP[category]) {
        return CATEGORY_ICON_MAP[category];
    }

    return null;
}

/**
 * Holt das Emoji für ein Item (Legacy Fallback - nicht mehr verwendet)
 * @deprecated Use getItemHugeIcon instead
 */
export function getItemEmoji(category: string, _itemName?: string): string {
    const emojis: Record<string, string> = {
        'food': '🍔',
        'drink': '🥤',
        'medical': '💊',
        'drug': '💉',
        'weapon': '🔫',
        'ammo': '🎯',
        'tool': '🔧',
        'clothing': '👕',
        'accessory': '💍',
        'document': '📄',
        'electronic': '📱',
        'container': '🎒',
        'key': '🔑',
        'vehicle': '🚗',
        'book': '📚',
        'fuel': '⛽',
        'tuning': '⚙️',
        'misc': '📦',
        'money': '💵',
    };
    return emojis[category] || '📦';
}

// ==================== REACT COMPONENTS ====================

interface ItemIconProps {
    iconName?: string;
    category?: string;
    itemName?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
}

/**
 * Size mappings for HugeiconsIcon
 */
const SIZE_MAP = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};

/**
 * Item Icon Component - Verwendet Hugeicons
 */
export function ItemIcon({
    iconName,
    category,
    itemName,
    className = '',
    size = 'md',
    color = 'currentColor',
}: ItemIconProps): React.ReactElement {
    // Try to find icon by itemName first, then iconName, then category
    const icon = getItemHugeIcon(itemName, category) ||
                 getItemHugeIcon(iconName, category) ||
                 PackageIcon;

    return (
        <HugeiconsIcon
            icon={icon}
            size={SIZE_MAP[size]}
            color={color}
            className={className}
        />
    );
}

/**
 * Tuning Item Icon Component
 * Speziell für Tuning-Items
 */
export function TuningItemIcon({
    iconName,
    className = '',
    size = 'md',
}: {
    iconName: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}): React.ReactElement {
    return (
        <ItemIcon
            iconName={iconName}
            category="tuning"
            className={className}
            size={size}
        />
    );
}

export default ItemIcon;
