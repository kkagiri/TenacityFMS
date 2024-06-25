using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class RecipesIngr
{
    public int IngrId { get; set; }

    public int? Recipeid { get; set; }

    public int? IngrProdId { get; set; }

    public double? IngrAmount { get; set; }
}
