export type NamedItem = {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: string;
};

export type StatItem = { name: string; count: number };
export type Stats = { total?: number; top: StatItem[] };

export type ClinicalOverview = {
    getTotalConditions?: number;
    getTotalAllergies?: number;
    top5Condition?: StatItem[];
    top5Allergy?: StatItem[];
};

export type CollectionKind = "conditions" | "allergies";

export type AllergyResponse = {
    id: string;
    name: string;
};

export type ConditionResponse = {
    id: string;
    name: string;
};