export type NamedItem = {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: string;
};

export type StatItem = { name: string; count: number };
export type Stats = { total?: number; top: StatItem[] };


export type CollectionKind = "conditions" | "allergies";

export type ClinicalResponse = {
    top5Condition: Array<Record<string, unknown>>;
    top5Allergy: Array<Record<string, unknown>>;
    getTotalAllergies: number;
    getTotalConditions: number;
  };

export type ConditionRequest = {
    name: string;
};
export type AllergyRequest = ConditionRequest;

export type RuleType = "AVOID" | "LIMIT" | "PREFER";
export type RuleScope = "ITEM"| "MEAL" | "DAY";
export type TargetType = "NUTRIENT" | "FOOD_TAG";
export type Comparator = "LT"|"LTE"|"EQ"|"GTE"|"GT"|"BETWEEN";
export type Gender = "MALE"| "FEMALE" |"OTHER"


export type NutritionRuleResponse = {
    id: string;
    ruleType: RuleType; 
    scope: RuleScope;
    targetType: TargetType;
    targetCode?: string | null;
    comparator?: Comparator | null;
    thresholdMin?: number | null;
    thresholdMax?: number | null;
    perKg: Boolean;
    frequencyPerScope?: number | null;
    applicableSex?:  Gender | null;
    ageMin?: number | null;
    ageMax?: number | null;
    message: string;
    source: string;
    tags: string[];
}

export type NutritionRuleUpdateDto = {
  ruleType: RuleType;
  scope: RuleScope;
  targetType: TargetType;
  targetCode?: string | null;
  comparator?: Comparator | null;
  thresholdMin?: number | null;
  thresholdMax?: number | null;
  perKg?: boolean | null;
  frequencyPerScope?: number | null;
  applicableSex?: Gender | null;
  ageMin?: number | null;
  ageMax?: number | null;
  source?: string | null;
  active?: boolean | null;
  foodTags?: string[]; 
  message?: string | null;
}

export type AllergyResponse = {
    id: string;
    name: string;
    nutritionRules: NutritionRuleResponse[];
};


export type ConditionResponse = {
    id: string;
    name: string;
    nutritionRules: NutritionRuleResponse[];
};

export type CreationRuleAI = {
    conditionId?: string;
    allergyId?: string;
    message: string;
};