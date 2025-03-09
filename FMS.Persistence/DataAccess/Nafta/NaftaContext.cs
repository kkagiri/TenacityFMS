using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using FMS.Domain.ATGEntities.Nafta;

namespace FMS.Persistence.DataAccess.Nafta
{
    public partial class NaftaContext : DbContext
    {
        public NaftaContext()
        {
        }

        public NaftaContext(DbContextOptions<NaftaContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Additionalinfo> Additionalinfos { get; set; }

        public virtual DbSet<Append> Appends { get; set; }

        public virtual DbSet<Barcode> Barcodes { get; set; }

        public virtual DbSet<BookChangeLog> BookChangeLogs { get; set; }

        public virtual DbSet<BookChangeReason> BookChangeReasons { get; set; }

        public virtual DbSet<Carwash> Carwashes { get; set; }

        public virtual DbSet<Carwash2> Carwash2s { get; set; }

        public virtual DbSet<Carwasherr> Carwasherrs { get; set; }

        public virtual DbSet<Cashform> Cashforms { get; set; }

        public virtual DbSet<Cashformsum> Cashformsums { get; set; }

        public virtual DbSet<Cashformsumhost> Cashformsumhosts { get; set; }

        public virtual DbSet<CashwinReceipt> CashwinReceipts { get; set; }

        public virtual DbSet<CashwinReceiptsInfo> CashwinReceiptsInfos { get; set; }

        public virtual DbSet<Client> Clients { get; set; }

        public virtual DbSet<ErrorGoodsDescription> ErrorGoodsDescriptions { get; set; }

        public virtual DbSet<Findatum> Findata { get; set; }

        public virtual DbSet<Fmcashform> Fmcashforms { get; set; }

        public virtual DbSet<FuelStorage> FuelStorages { get; set; }

        public virtual DbSet<Group> Groups { get; set; }

        public virtual DbSet<HiddenPrice> HiddenPrices { get; set; }

        public virtual DbSet<Host> Hosts { get; set; }

        public virtual DbSet<NaftaCardsRefill> NaftaCardsRefills { get; set; }

        public virtual DbSet<NaftaCardsTable> NaftaCardsTables { get; set; }

        public virtual DbSet<Nakreg> Nakregs { get; set; }

        public virtual DbSet<NewPrice> NewPrices { get; set; }

        public virtual DbSet<NewPricesProcess> NewPricesProcesses { get; set; }

        public virtual DbSet<Operator> Operators { get; set; }

        public virtual DbSet<PetrolSheet> PetrolSheets { get; set; }

        public virtual DbSet<PetrolTerm> PetrolTerms { get; set; }

        public virtual DbSet<Petrolstationinfo> Petrolstationinfos { get; set; }

        public virtual DbSet<PriceChangesLog> PriceChangesLogs { get; set; }

        public virtual DbSet<Product> Products { get; set; }

        public virtual DbSet<ProductPolicy> ProductPolicies { get; set; }

        public virtual DbSet<ProductType> ProductTypes { get; set; }

        public virtual DbSet<ProductsChanged> ProductsChangeds { get; set; }

        public virtual DbSet<Pump> Pumps { get; set; }

        public virtual DbSet<RecipesIngr> RecipesIngrs { get; set; }

        public virtual DbSet<Remain> Remains { get; set; }

        public virtual DbSet<Rfindatum> Rfindata { get; set; }

        public virtual DbSet<Rpump> Rpumps { get; set; }

        public virtual DbSet<Rtank> Rtanks { get; set; }

        public virtual DbSet<Rtrk> Rtrks { get; set; }

        public virtual DbSet<Sale> Sales { get; set; }

        public virtual DbSet<SaleDatum> SaleData { get; set; }

        public virtual DbSet<SalesCounter> SalesCounters { get; set; }

        public virtual DbSet<SalesDelayed> SalesDelayeds { get; set; }

        public virtual DbSet<SalesIngredient> SalesIngredients { get; set; }

        public virtual DbSet<SalesLoyalty> SalesLoyalties { get; set; }

        public virtual DbSet<Saletag> Saletags { get; set; }

        public virtual DbSet<Section> Sections { get; set; }

        public virtual DbSet<Session> Sessions { get; set; }

        public virtual DbSet<Sheet> Sheets { get; set; }

        public virtual DbSet<Talon> Talons { get; set; }

        public virtual DbSet<TalonsBlacklist> TalonsBlacklists { get; set; }

        public virtual DbSet<Tank> Tanks { get; set; }

        public virtual DbSet<Tankmonitor> Tankmonitors { get; set; }

        public virtual DbSet<Tax> Taxes { get; set; }

        public virtual DbSet<Taxreg> Taxregs { get; set; }

        public virtual DbSet<Trk> Trks { get; set; }

        public virtual DbSet<Version> Versions { get; set; }

        // # protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        //#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
        //   #    => optionsBuilder.UseMySql("server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=Hyoung2030;connection timeout=10000;command timeout=10000", Microsoft.EntityFrameworkCore.ServerVersion.Parse("5.7.20-mysql"));

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder
                .UseCollation("utf8_general_ci")
                .HasCharSet("utf8");

            modelBuilder.Entity<Additionalinfo>(entity =>
            {
                entity.HasKey(e => e.KeyName).HasName("PRIMARY");

                entity
                    .ToTable("additionalinfo")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.KeyName)
                    .HasMaxLength(150)
                    .HasDefaultValueSql("''");
                entity.Property(e => e.KeyValue).HasMaxLength(250);
            });

            modelBuilder.Entity<Append>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("append")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Session, e.Productid }, "APPEND_1");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Amount).HasColumnName("AMOUNT");
                entity.Property(e => e.Book1).HasColumnName("BOOK1");
                entity.Property(e => e.Book2).HasColumnName("BOOK2");
                entity.Property(e => e.Client)
                    .HasColumnType("int(11)")
                    .HasColumnName("CLIENT");
                entity.Property(e => e.Completed)
                    .HasColumnType("int(11)")
                    .HasColumnName("COMPLETED");
                entity.Property(e => e.Completetime)
                    .HasMaxLength(24)
                    .HasColumnName("COMPLETETIME");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.DensityAbs).HasColumnName("DENSITY_ABS");
                entity.Property(e => e.DensityE).HasColumnName("DENSITY_E");
                entity.Property(e => e.DensityS).HasColumnName("DENSITY_S");
                entity.Property(e => e.Diff).HasColumnName("DIFF");
                entity.Property(e => e.Doc)
                    .HasMaxLength(80)
                    .HasColumnName("DOC");
                entity.Property(e => e.Endremainder).HasColumnName("ENDREMAINDER");
                entity.Property(e => e.Fact).HasColumnName("FACT");
                entity.Property(e => e.FuelHeightAbs).HasColumnName("FUEL_HEIGHT_ABS");
                entity.Property(e => e.FuelHeightE).HasColumnName("FUEL_HEIGHT_E");
                entity.Property(e => e.FuelHeightS).HasColumnName("FUEL_HEIGHT_S");
                entity.Property(e => e.FuelVolumeE).HasColumnName("FUEL_VOLUME_E");
                entity.Property(e => e.FuelVolumeS).HasColumnName("FUEL_VOLUME_S");
                entity.Property(e => e.Host)
                    .HasColumnType("int(11)")
                    .HasColumnName("HOST");
                entity.Property(e => e.Invoice)
                    .HasMaxLength(50)
                    .HasColumnName("INVOICE");
                entity.Property(e => e.MassAbs).HasColumnName("MASS_ABS");
                entity.Property(e => e.MassE).HasColumnName("MASS_E");
                entity.Property(e => e.MassS).HasColumnName("MASS_S");
                entity.Property(e => e.Mode)
                    .HasColumnType("int(11)")
                    .HasColumnName("MODE");
                entity.Property(e => e.OilDepotId)
                    .HasColumnType("int(11)")
                    .HasColumnName("OIL_DEPOT_ID");
                entity.Property(e => e.Price).HasColumnName("PRICE");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Remainder).HasColumnName("REMAINDER");
                entity.Property(e => e.Remotedelivery)
                    .HasColumnType("int(3)")
                    .HasColumnName("REMOTEDELIVERY");
                entity.Property(e => e.RouteId)
                    .HasMaxLength(10)
                    .HasColumnName("ROUTE_ID");
                entity.Property(e => e.Saletag1)
                    .HasColumnType("int(11)")
                    .HasColumnName("SALETAG1");
                entity.Property(e => e.Saletag2)
                    .HasColumnType("int(11)")
                    .HasColumnName("SALETAG2");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Sprice).HasColumnName("SPRICE");
                entity.Property(e => e.TankerId)
                    .HasMaxLength(14)
                    .HasColumnName("TANKER_ID");
                entity.Property(e => e.Tankno)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.TcDensityAbs).HasColumnName("TC_DENSITY_ABS");
                entity.Property(e => e.TcDensityE).HasColumnName("TC_DENSITY_E");
                entity.Property(e => e.TcDensityS).HasColumnName("TC_DENSITY_S");
                entity.Property(e => e.TcVolumeAbs).HasColumnName("TC_VOLUME_ABS");
                entity.Property(e => e.TcVolumeE).HasColumnName("TC_VOLUME_E");
                entity.Property(e => e.TcVolumeS).HasColumnName("TC_VOLUME_S");
                entity.Property(e => e.TemperatureAbs).HasColumnName("TEMPERATURE_ABS");
                entity.Property(e => e.TemperatureE).HasColumnName("TEMPERATURE_E");
                entity.Property(e => e.TemperatureS).HasColumnName("TEMPERATURE_S");
                entity.Property(e => e.Uid)
                    .HasMaxLength(14)
                    .HasColumnName("UID");
                entity.Property(e => e.WaterHeightAbs).HasColumnName("WATER_HEIGHT_ABS");
                entity.Property(e => e.WaterHeightE).HasColumnName("WATER_HEIGHT_E");
                entity.Property(e => e.WaterHeightS).HasColumnName("WATER_HEIGHT_S");
            });

            modelBuilder.Entity<Barcode>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("barcode")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Barcode1, e.Productid }, "BARCODE_1");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Barcode1)
                    .HasMaxLength(24)
                    .HasColumnName("BARCODE");
                entity.Property(e => e.Mask)
                    .HasMaxLength(24)
                    .HasColumnName("MASK");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
            });

            modelBuilder.Entity<BookChangeLog>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("book_change_log")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Id, "book_change_log_1");

                entity.Property(e => e.Book1).HasColumnName("book1");
                entity.Property(e => e.Book2).HasColumnName("book2");
                entity.Property(e => e.Bookcorr).HasColumnName("bookcorr");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("createtime");
                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.Reasonid)
                    .HasColumnType("int(11)")
                    .HasColumnName("reasonid");
                entity.Property(e => e.Sessionid)
                    .HasColumnType("int(11)")
                    .HasColumnName("sessionid");
                entity.Property(e => e.Tankno)
                    .HasColumnType("int(11)")
                    .HasColumnName("tankno");
            });

            modelBuilder.Entity<BookChangeReason>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("book_change_reasons")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Id, "book_change_reasons_1");

                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("createtime");
                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.ReasonText)
                    .HasMaxLength(24)
                    .HasColumnName("reason_text");
            });

            modelBuilder.Entity<Carwash>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("carwash")
                    .HasCharSet("cp1251")
                    .UseCollation("cp1251_general_ci");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.Counter)
                    .HasColumnType("int(11)")
                    .HasColumnName("counter");
                entity.Property(e => e.Parcial)
                    .HasColumnType("int(11)")
                    .HasColumnName("parcial");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("session");
                entity.Property(e => e.Sessionct)
                    .HasColumnType("int(11)")
                    .HasColumnName("sessionct");
                entity.Property(e => e.Sessionctparc)
                    .HasColumnType("int(11)")
                    .HasColumnName("sessionctparc");
                entity.Property(e => e.TTime)
                    .HasColumnType("int(11)")
                    .HasColumnName("t_time");
                entity.Property(e => e.Time)
                    .HasMaxLength(20)
                    .HasColumnName("time");
                entity.Property(e => e.Total)
                    .HasColumnType("int(11)")
                    .HasColumnName("total");
            });

            modelBuilder.Entity<Carwash2>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("carwash2")
                    .HasCharSet("cp1251")
                    .UseCollation("cp1251_general_ci");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.Counter)
                    .HasColumnType("int(11)")
                    .HasColumnName("counter");
                entity.Property(e => e.ProductId)
                    .HasColumnType("int(11)")
                    .HasColumnName("ProductID");
            });

            modelBuilder.Entity<Carwasherr>(entity =>
            {
                entity.HasKey(e => e.IdAuto).HasName("PRIMARY");

                entity
                    .ToTable("carwasherr")
                    .HasCharSet("cp1251")
                    .UseCollation("cp1251_general_ci");

                entity.Property(e => e.IdAuto)
                    .HasColumnType("int(11)")
                    .HasColumnName("id_auto");
                entity.Property(e => e.Errortype)
                    .HasColumnType("int(11)")
                    .HasColumnName("errortype");
                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("session");
                entity.Property(e => e.Sessionct)
                    .HasColumnType("int(11)")
                    .HasColumnName("sessionct");
                entity.Property(e => e.TTime)
                    .HasColumnType("int(11)")
                    .HasColumnName("t_time");
                entity.Property(e => e.Time)
                    .HasMaxLength(20)
                    .HasColumnName("time");
                entity.Property(e => e.Washnumber)
                    .HasColumnType("int(11)")
                    .HasColumnName("washnumber");
            });

            modelBuilder.Entity<Cashform>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("cashform")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Name)
                    .HasMaxLength(48)
                    .HasColumnName("NAME");
                entity.Property(e => e.Picture)
                    .HasColumnType("blob")
                    .HasColumnName("PICTURE");
            });

            modelBuilder.Entity<Cashformsum>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToView("cashformsum");

                entity.Property(e => e.CashForm).HasColumnType("int(11)");
                entity.Property(e => e.CashName)
                    .HasMaxLength(24)
                    .UseCollation("utf8_unicode_ci");
                entity.Property(e => e.Session).HasColumnType("int(11)");
            });

            modelBuilder.Entity<Cashformsumhost>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToView("cashformsumhost");

                entity.Property(e => e.CashForm).HasColumnType("int(11)");
                entity.Property(e => e.CashName)
                    .HasMaxLength(24)
                    .UseCollation("utf8_unicode_ci");
                entity.Property(e => e.Host).HasColumnType("int(11)");
                entity.Property(e => e.Session).HasColumnType("int(11)");
            });

            modelBuilder.Entity<CashwinReceipt>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("cashwin_receipts")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasComment("record id")
                    .HasColumnType("bigint(11)");
                entity.Property(e => e.Amount).HasComment("actual amount");
                entity.Property(e => e.BillNum)
                    .HasComment("receipt number")
                    .HasColumnType("bigint(11)");
                entity.Property(e => e.CardData)
                    .HasMaxLength(256)
                    .HasComment("card info");
                entity.Property(e => e.Cash)
                    .HasComment("cash")
                    .HasColumnName("cash");
                entity.Property(e => e.CashFlag)
                    .HasComment("cash flag")
                    .HasColumnType("int(11)");
                entity.Property(e => e.Cashier)
                    .HasMaxLength(256)
                    .HasComment("Cashier Name")
                    .HasColumnName("cashier");
                entity.Property(e => e.Change)
                    .HasComment("change")
                    .HasColumnName("change");
                entity.Property(e => e.Date)
                    .HasMaxLength(256)
                    .HasComment("date")
                    .HasColumnName("date");
                entity.Property(e => e.Discount).HasComment("discount in %");
                entity.Property(e => e.DocNo)
                    .HasMaxLength(256)
                    .HasComment("text info");
                entity.Property(e => e.Entry)
                    .HasComment("entry")
                    .HasColumnName("entry");
                entity.Property(e => e.Flags)
                    .HasComment("data flag")
                    .HasColumnType("int(11)");
                entity.Property(e => e.InfoId)
                    .HasComment("linked record id")
                    .HasColumnType("int(11)")
                    .HasColumnName("info_id");
                entity.Property(e => e.MPCost)
                    .HasComment("actual sum")
                    .HasColumnName("mP_Cost");
                entity.Property(e => e.MPCounters)
                    .HasComment("pump counter")
                    .HasColumnName("mP_Counters");
                entity.Property(e => e.MPMultiplier)
                    .HasComment("data multiplier")
                    .HasColumnType("int(11)")
                    .HasColumnName("mP_Multiplier");
                entity.Property(e => e.MPNozzleNo)
                    .HasComment("nozzle number")
                    .HasColumnType("int(11)")
                    .HasColumnName("mP_NozzleNo");
                entity.Property(e => e.MPPresetCost)
                    .HasComment("preordered sum")
                    .HasColumnName("mP_PresetCost");
                entity.Property(e => e.MPService)
                    .HasMaxLength(256)
                    .HasComment("service info")
                    .HasColumnName("mP_Service");
                entity.Property(e => e.MPTrkstatus)
                    .HasComment("trk status")
                    .HasColumnType("int(11)")
                    .HasColumnName("mP_TRKStatus");
                entity.Property(e => e.Name)
                    .HasMaxLength(256)
                    .HasComment("product name");
                entity.Property(e => e.NdsPerc)
                    .HasComment("nds_perc")
                    .HasColumnName("nds_perc");
                entity.Property(e => e.Payment).HasComment("payed");
                entity.Property(e => e.PreAmount).HasComment("preordered amount");
                entity.Property(e => e.Price).HasComment("product price");
                entity.Property(e => e.ProductGroup)
                    .HasComment("product group")
                    .HasColumnType("int(11)");
                entity.Property(e => e.ProductId)
                    .HasComment("product id")
                    .HasColumnType("bigint(11)")
                    .HasColumnName("ProductID");
                entity.Property(e => e.RecType)
                    .HasComment("type of printed receipt")
                    .HasColumnType("int(11)")
                    .HasColumnName("rec_type");
                entity.Property(e => e.Section)
                    .HasComment("product section")
                    .HasColumnType("int(11)");
                entity.Property(e => e.Tag)
                    .HasComment("sale tag")
                    .HasColumnType("bigint(11)");
                entity.Property(e => e.Tank)
                    .HasComment("tank number")
                    .HasColumnType("int(11)");
                entity.Property(e => e.TaxGroup)
                    .HasComment("tax group")
                    .HasColumnType("int(11)");
                entity.Property(e => e.Time)
                    .HasMaxLength(256)
                    .HasComment("time")
                    .HasColumnName("time");
                entity.Property(e => e.Total)
                    .HasComment("total")
                    .HasColumnName("total");
                entity.Property(e => e.TotalMBegin)
                    .HasComment("money totalizers on begin")
                    .HasColumnName("total_m_begin");
                entity.Property(e => e.TotalMEnd)
                    .HasComment("money totalizers on end")
                    .HasColumnName("total_m_end");
                entity.Property(e => e.TotalVBegin)
                    .HasComment("volume totalizers on begin")
                    .HasColumnName("total_v_begin");
                entity.Property(e => e.TotalVEnd)
                    .HasComment("volume totalizers on end")
                    .HasColumnName("total_v_end");
                entity.Property(e => e.Trk)
                    .HasComment("pump number")
                    .HasColumnType("int(11)");
            });

            modelBuilder.Entity<CashwinReceiptsInfo>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("cashwin_receipts_info")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasComment("record id")
                    .HasColumnType("bigint(11)");
                entity.Property(e => e.SaleTag)
                    .HasComment("from sales.saletag")
                    .HasColumnType("bigint(11)");
            });

            modelBuilder.Entity<Client>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("clients")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Address)
                    .HasMaxLength(80)
                    .HasColumnName("ADDRESS");
                entity.Property(e => e.Certificate)
                    .HasMaxLength(80)
                    .HasColumnName("CERTIFICATE");
                entity.Property(e => e.ClientType)
                    .HasColumnType("int(11)")
                    .HasColumnName("CLIENT_TYPE");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.Name)
                    .HasMaxLength(80)
                    .HasColumnName("NAME");
                entity.Property(e => e.PhoneNumber)
                    .HasMaxLength(80)
                    .HasColumnName("PHONE_NUMBER");
                entity.Property(e => e.TaxNumber)
                    .HasMaxLength(80)
                    .HasColumnName("TAX_NUMBER");
            });

            modelBuilder.Entity<ErrorGoodsDescription>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("error_goods_description")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Id, "new_error_goods_description_1");

                entity.Property(e => e.Description)
                    .HasMaxLength(100)
                    .HasColumnName("description");
                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
            });

            modelBuilder.Entity<Findatum>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("findata")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Host, e.Name, e.Index1, e.Index2 }, "FINDATA_1");

                entity.HasIndex(e => new { e.Host, e.Cashid, e.Name, e.Index1, e.Index2 }, "FINDATA_2");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Cashid)
                    .HasMaxLength(24)
                    .HasColumnName("CASHID");
                entity.Property(e => e.Floatvalue).HasColumnName("FLOATVALUE");
                entity.Property(e => e.Host)
                    .HasColumnType("int(11)")
                    .HasColumnName("HOST");
                entity.Property(e => e.Index1)
                    .HasColumnType("int(11)")
                    .HasColumnName("INDEX1");
                entity.Property(e => e.Index2)
                    .HasColumnType("int(11)")
                    .HasColumnName("INDEX2");
                entity.Property(e => e.Intvalue)
                    .HasColumnType("int(11)")
                    .HasColumnName("INTVALUE");
                entity.Property(e => e.Name)
                    .HasMaxLength(24)
                    .HasColumnName("NAME");
                entity.Property(e => e.Stringvalue)
                    .HasMaxLength(40)
                    .HasColumnName("STRINGVALUE");
            });

            modelBuilder.Entity<Fmcashform>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("fmcashform")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Cashform)
                    .HasColumnType("int(11)")
                    .HasColumnName("CASHFORM");
                entity.Property(e => e.Name)
                    .HasMaxLength(24)
                    .HasColumnName("NAME");
            });

            modelBuilder.Entity<FuelStorage>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity.ToTable("fuel_storages");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Address)
                    .HasMaxLength(256)
                    .HasColumnName("ADDRESS");
                entity.Property(e => e.CreateTime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATE_TIME");
                entity.Property(e => e.Name)
                    .HasMaxLength(128)
                    .HasColumnName("NAME");
                entity.Property(e => e.PhoneNumber)
                    .HasMaxLength(16)
                    .HasColumnName("PHONE_NUMBER");
            });

            modelBuilder.Entity<Group>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("groups")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Description)
                    .HasMaxLength(256)
                    .HasColumnName("DESCRIPTION");
                entity.Property(e => e.ExciseCodePresent)
                    .HasDefaultValueSql("'0'")
                    .HasColumnType("smallint(3)")
                    .HasColumnName("EXCISE_CODE_PRESENT");
                entity.Property(e => e.Image)
                    .HasDefaultValueSql("'0'")
                    .HasColumnType("int(11)")
                    .HasColumnName("IMAGE");
                entity.Property(e => e.Name)
                    .HasMaxLength(80)
                    .HasColumnName("NAME");
                entity.Property(e => e.UidGroup)
                    .HasMaxLength(10)
                    .HasColumnName("UID_GROUP");
            });

            modelBuilder.Entity<HiddenPrice>(entity =>
            {
                entity.HasKey(e => e.Productid).HasName("PRIMARY");

                entity
                    .ToTable("hidden_prices")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Productid)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("productid");
                entity.Property(e => e.Price).HasColumnName("price");
            });

            modelBuilder.Entity<Host>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("host")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Ip, "HOST_1");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Cashid)
                    .HasMaxLength(24)
                    .HasColumnName("CASHID");
                entity.Property(e => e.Ip)
                    .HasColumnType("bigint(20)")
                    .HasColumnName("IP");
                entity.Property(e => e.Name)
                    .HasMaxLength(80)
                    .HasColumnName("NAME");
            });

            modelBuilder.Entity<NaftaCardsRefill>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("nafta_cards_refill")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.AccId)
                    .HasColumnType("int(11)")
                    .HasColumnName("acc_id");
                entity.Property(e => e.Amount).HasColumnName("amount");
                entity.Property(e => e.CardId)
                    .HasColumnType("int(11)")
                    .HasColumnName("card_id");
                entity.Property(e => e.Cardext)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("cardext");
                entity.Property(e => e.CashFlag)
                    .HasColumnType("int(11)")
                    .HasColumnName("cash_flag");
                entity.Property(e => e.Cost).HasColumnName("cost");
                entity.Property(e => e.Date)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP")
                    .HasColumnType("timestamp")
                    .HasColumnName("date");
                entity.Property(e => e.DateStr)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("date_str");
                entity.Property(e => e.Price).HasColumnName("price");
                entity.Property(e => e.ProdId)
                    .HasColumnType("int(11)")
                    .HasColumnName("prod_id");
                entity.Property(e => e.Session)
                    .HasColumnType("bigint(11)")
                    .HasColumnName("session");
                entity.Property(e => e.Type)
                    .HasColumnType("int(11)")
                    .HasColumnName("type");
                entity.Property(e => e.TypeStr)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("type_str");
            });

            modelBuilder.Entity<NaftaCardsTable>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("nafta_cards_table")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.Balance).HasColumnName("balance");
                entity.Property(e => e.CardId)
                    .HasColumnType("int(11)")
                    .HasColumnName("card_id");
                entity.Property(e => e.Cardcode)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("cardcode");
                entity.Property(e => e.Cardext)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("cardext");
                entity.Property(e => e.Firm)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("firm");
                entity.Property(e => e.FirmId)
                    .HasColumnType("int(11)")
                    .HasColumnName("firm_id");
                entity.Property(e => e.Holder)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("holder");
                entity.Property(e => e.HolderId)
                    .HasColumnType("int(11)")
                    .HasColumnName("holder_id");
                entity.Property(e => e.Limited)
                    .HasColumnType("int(11)")
                    .HasColumnName("limited");
                entity.Property(e => e.RecNo)
                    .HasColumnType("bigint(11)")
                    .HasColumnName("rec_no");
                entity.Property(e => e.RecNoStr)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("rec_no_str");
                entity.Property(e => e.Saletag)
                    .HasColumnType("bigint(11)")
                    .HasColumnName("saletag");
                entity.Property(e => e.Type)
                    .HasColumnType("int(11)")
                    .HasColumnName("type");
                entity.Property(e => e.TypeStr)
                    .HasMaxLength(32)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("type_str");
            });

            modelBuilder.Entity<Nakreg>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("nakreg")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Client, "NAKREG_1");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Amount).HasColumnName("AMOUNT");
                entity.Property(e => e.Cashform)
                    .HasColumnType("int(11)")
                    .HasColumnName("CASHFORM");
                entity.Property(e => e.Client)
                    .HasColumnType("int(11)")
                    .HasColumnName("CLIENT");
                entity.Property(e => e.Cost).HasColumnName("COST");
                entity.Property(e => e.Createtime)
                    .HasColumnType("datetime")
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.Discount).HasColumnName("DISCOUNT");
                entity.Property(e => e.Doc)
                    .HasMaxLength(24)
                    .HasColumnName("DOC");
                entity.Property(e => e.Name)
                    .HasMaxLength(80)
                    .HasColumnName("NAME");
                entity.Property(e => e.Price).HasColumnName("PRICE");
                entity.Property(e => e.Productname)
                    .HasMaxLength(80)
                    .HasColumnName("PRODUCTNAME");
                entity.Property(e => e.Unit)
                    .HasMaxLength(24)
                    .HasColumnName("UNIT");
            });

            modelBuilder.Entity<NewPrice>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("new_prices")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Id, "new_prices_1");

                entity.Property(e => e.Amount).HasColumnName("amount");
                entity.Property(e => e.Applydatetime)
                    .HasMaxLength(24)
                    .HasColumnName("applydatetime");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("createtime");
                entity.Property(e => e.Docid)
                    .HasColumnType("int(11)")
                    .HasColumnName("docid");
                entity.Property(e => e.FeedId)
                    .HasColumnType("int(11)")
                    .HasColumnName("feed_id");
                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.NewPrice1).HasColumnName("new_price");
                entity.Property(e => e.OldPrice).HasColumnName("old_price");
                entity.Property(e => e.PriceType)
                    .HasColumnType("int(11)")
                    .HasColumnName("price_type");
                entity.Property(e => e.Processed)
                    .HasColumnType("int(11)")
                    .HasColumnName("processed");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("productid");
            });

            modelBuilder.Entity<NewPricesProcess>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("new_prices_process")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Id, "new_prices_process_1");

                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("createtime");
                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.Processed)
                    .HasColumnType("int(11)")
                    .HasColumnName("processed");
            });

            modelBuilder.Entity<Operator>(entity =>
            {
                entity.HasKey(e => e.Operatorid).HasName("PRIMARY");

                entity
                    .ToTable("operator")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Operatorid)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("OPERATORID");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.Idcard)
                    .HasMaxLength(64)
                    .HasColumnName("IDCARD");
                entity.Property(e => e.Name)
                    .HasMaxLength(40)
                    .HasColumnName("NAME");
                entity.Property(e => e.Orderno)
                    .HasColumnType("int(11)")
                    .HasColumnName("ORDERNO");
                entity.Property(e => e.Permissions)
                    .HasColumnType("bigint(16)")
                    .HasColumnName("PERMISSIONS");
                entity.Property(e => e.Pswrd)
                    .HasMaxLength(40)
                    .HasColumnName("PSWRD");
            });

            modelBuilder.Entity<PetrolSheet>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("petrol_sheet")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Id, e.SheetId }, "PETROL_SHEET1");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.SheetId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SHEET_ID");
            });

            modelBuilder.Entity<PetrolTerm>(entity =>
            {
                entity.HasKey(e => e.SheetId).HasName("PRIMARY");

                entity
                    .ToTable("petrol_term")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.SheetId, e.Term }, "PETROL_TERM1");

                entity.Property(e => e.SheetId)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("SHEET_ID");
                entity.Property(e => e.Term)
                    .HasColumnType("int(11)")
                    .HasColumnName("TERM");
            });

            modelBuilder.Entity<Petrolstationinfo>(entity =>
            {
                entity.HasKey(e => e.PetrolStationName).HasName("PRIMARY");

                entity
                    .ToTable("petrolstationinfo")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.PetrolStationName)
                    .HasMaxLength(150)
                    .HasDefaultValueSql("''");
                entity.Property(e => e.CompanyIdCode).HasMaxLength(150);
                entity.Property(e => e.CompanyName).HasMaxLength(150);
                entity.Property(e => e.ManagerName).HasMaxLength(150);
                entity.Property(e => e.PetrolStationAddress).HasMaxLength(150);
                entity.Property(e => e.PetrolStationIdCode).HasMaxLength(150);
                entity.Property(e => e.RegistrationCode).HasMaxLength(150);
            });

            modelBuilder.Entity<PriceChangesLog>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("price_changes_log")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Id, "price_changes_log_1");

                entity.Property(e => e.Amount).HasColumnName("amount");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("createtime");
                entity.Property(e => e.Errorid)
                    .HasColumnType("int(11)")
                    .HasColumnName("errorid");
                entity.Property(e => e.FeedId)
                    .HasColumnType("int(11)")
                    .HasColumnName("feed_id");
                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.NewPrice).HasColumnName("new_price");
                entity.Property(e => e.Npid)
                    .HasColumnType("int(11)")
                    .HasColumnName("npid");
                entity.Property(e => e.OldPrice).HasColumnName("old_price");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("productid");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("session");
                entity.Property(e => e.Targettime)
                    .HasMaxLength(24)
                    .HasColumnName("targettime");
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Productid).HasName("PRIMARY");

                entity
                    .ToTable("product")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Productid)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Amount)
                    .HasDefaultValueSql("'0'")
                    .HasColumnName("AMOUNT");
                entity.Property(e => e.Barcode)
                    .HasMaxLength(24)
                    .HasColumnName("BARCODE");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.Description)
                    .HasMaxLength(160)
                    .HasColumnName("DESCRIPTION");
                entity.Property(e => e.Disabled).HasColumnName("DISABLED");
                entity.Property(e => e.Image)
                    .HasColumnType("int(11)")
                    .HasColumnName("IMAGE");
                entity.Property(e => e.Longname)
                    .HasMaxLength(160)
                    .HasColumnName("LONGNAME");
                entity.Property(e => e.Name)
                    .HasMaxLength(80)
                    .HasColumnName("NAME");
                entity.Property(e => e.Office)
                    .HasDefaultValueSql("'1'")
                    .HasColumnType("int(11)")
                    .HasColumnName("OFFICE");
                entity.Property(e => e.Package)
                    .HasMaxLength(160)
                    .HasColumnName("PACKAGE");
                entity.Property(e => e.Plu)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("PLU");
                entity.Property(e => e.Price).HasColumnName("PRICE");
                entity.Property(e => e.Productgroup)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("PRODUCTGROUP");
                entity.Property(e => e.Section)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("SECTION");
                entity.Property(e => e.Tax)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TAX");
                entity.Property(e => e.Type)
                    .HasColumnType("int(11)")
                    .HasColumnName("TYPE");
                entity.Property(e => e.Uid)
                    .HasMaxLength(24)
                    .HasColumnName("UID");
                entity.Property(e => e.UidChanged)
                    .HasDefaultValueSql("'0'")
                    .HasColumnType("int(11)")
                    .HasColumnName("UID_CHANGED");
                entity.Property(e => e.Unit)
                    .HasMaxLength(24)
                    .HasColumnName("UNIT");
            });

            modelBuilder.Entity<ProductPolicy>(entity =>
            {
                entity.HasKey(e => e.Productid).HasName("PRIMARY");

                entity
                    .ToTable("product_policy")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Productid)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("productid");
                entity.Property(e => e.PolicyType)
                    .HasColumnType("int(11)")
                    .HasColumnName("policy_type");
            });

            modelBuilder.Entity<ProductType>(entity =>
            {
                entity.HasKey(e => e.ProductType1).HasName("PRIMARY");

                entity
                    .ToTable("product_types")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.ProductType1)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("product_type");
                entity.Property(e => e.TypeName)
                    .HasMaxLength(20)
                    .HasColumnName("type_name");
            });

            modelBuilder.Entity<ProductsChanged>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("products_changed")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Id, "products_changed_1");

                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("productid");
            });

            modelBuilder.Entity<Pump>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToView("pumps");

                entity.Property(e => e.Counter).HasColumnName("COUNTER");
                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.InnerCounter).HasColumnName("INNER_COUNTER");
                entity.Property(e => e.Nozzle)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("NOZZLE");
                entity.Property(e => e.Pump1)
                    .HasColumnType("int(11)")
                    .HasColumnName("Pump");
                entity.Property(e => e.Quality).HasColumnName("QUALITY");
                entity.Property(e => e.Tankno)
                    .HasColumnType("int(11)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Trk)
                    .HasColumnType("int(11)")
                    .HasColumnName("TRK");
            });

            modelBuilder.Entity<RecipesIngr>(entity =>
            {
                entity.HasKey(e => e.IngrId).HasName("PRIMARY");

                entity
                    .ToTable("recipes_ingr")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.IngrId)
                    .HasColumnType("int(11)")
                    .HasColumnName("ingr_id");
                entity.Property(e => e.IngrAmount).HasColumnName("ingr_amount");
                entity.Property(e => e.IngrProdId)
                    .HasColumnType("int(11)")
                    .HasColumnName("ingr_prod_id");
                entity.Property(e => e.Recipeid)
                    .HasColumnType("int(11)")
                    .HasColumnName("recipeid");
            });

            modelBuilder.Entity<Remain>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("remain")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Session, e.Productid }, "REMAIN_1");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Price1).HasColumnName("PRICE1");
                entity.Property(e => e.Price2).HasColumnName("PRICE2");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Rembegin).HasColumnName("REMBEGIN");
                entity.Property(e => e.Remend).HasColumnName("REMEND");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
            });

            modelBuilder.Entity<Rfindatum>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("rfindata")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Session, e.Host, e.Cashid }, "RFINDATA_1");

                entity.HasIndex(e => new { e.Session, e.Host, e.Cashid, e.Name }, "RFINDATA_2");

                entity.HasIndex(e => new { e.Session, e.Host, e.Cashid, e.Name, e.Index1, e.Index2 }, "RFINDATA_3");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Cashid)
                    .HasMaxLength(16)
                    .HasColumnName("CASHID");
                entity.Property(e => e.Floatvalue).HasColumnName("FLOATVALUE");
                entity.Property(e => e.Host)
                    .HasColumnType("int(11)")
                    .HasColumnName("HOST");
                entity.Property(e => e.Index1)
                    .HasColumnType("int(11)")
                    .HasColumnName("INDEX1");
                entity.Property(e => e.Index2)
                    .HasColumnType("int(11)")
                    .HasColumnName("INDEX2");
                entity.Property(e => e.Intvalue)
                    .HasColumnType("int(11)")
                    .HasColumnName("INTVALUE");
                entity.Property(e => e.Name)
                    .HasMaxLength(24)
                    .HasColumnName("NAME");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Stringvalue)
                    .HasMaxLength(50)
                    .HasColumnName("STRINGVALUE");
            });

            modelBuilder.Entity<Rpump>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToView("rpumps");

                entity.Property(e => e.Count1).HasColumnName("COUNT1");
                entity.Property(e => e.Count2).HasColumnName("COUNT2");
                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.InnerCount1).HasColumnName("INNER_COUNT1");
                entity.Property(e => e.InnerCount2).HasColumnName("INNER_COUNT2");
                entity.Property(e => e.Nozzle)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("NOZZLE");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Pump).HasColumnType("smallint(6)");
                entity.Property(e => e.Quality).HasColumnName("QUALITY");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Tankno)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Trk)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TRK");
            });

            modelBuilder.Entity<Rtank>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("rtank")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Session, e.Productid }, "RTANK_1");

                entity.HasIndex(e => new { e.Session, e.Tankno, e.Productid }, "RTANK_2");

                entity.HasIndex(e => new { e.Session, e.Tankno }, "RTANK_3");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Amount1).HasColumnName("AMOUNT1");
                entity.Property(e => e.Amount2).HasColumnName("AMOUNT2");
                entity.Property(e => e.Amountmm1).HasColumnName("AMOUNTMM1");
                entity.Property(e => e.Amountmm2).HasColumnName("AMOUNTMM2");
                entity.Property(e => e.Book1).HasColumnName("BOOK1");
                entity.Property(e => e.Book2).HasColumnName("BOOK2");
                entity.Property(e => e.Density1).HasColumnName("DENSITY1");
                entity.Property(e => e.Density2).HasColumnName("DENSITY2");
                entity.Property(e => e.Mass1).HasColumnName("MASS1");
                entity.Property(e => e.Mass2).HasColumnName("MASS2");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Tankno)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Temp1).HasColumnName("TEMP1");
                entity.Property(e => e.Temp15dens1).HasColumnName("TEMP15DENS1");
                entity.Property(e => e.Temp15dens2).HasColumnName("TEMP15DENS2");
                entity.Property(e => e.Temp15volume1).HasColumnName("TEMP15VOLUME1");
                entity.Property(e => e.Temp15volume2).HasColumnName("TEMP15VOLUME2");
                entity.Property(e => e.Temp2).HasColumnName("TEMP2");
                entity.Property(e => e.Water1).HasColumnName("WATER1");
                entity.Property(e => e.Water2).HasColumnName("WATER2");
                entity.Property(e => e.Watermm1).HasColumnName("WATERMM1");
                entity.Property(e => e.Watermm2).HasColumnName("WATERMM2");
            });

            modelBuilder.Entity<Rtrk>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("rtrk")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Session, e.Trk }, "RTRK_1");

                entity.HasIndex(e => new { e.Session, e.Trk, e.Nozzle }, "RTRK_2");

                entity.HasIndex(e => new { e.Session, e.Trk, e.Productid }, "RTRK_3");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Count1).HasColumnName("COUNT1");
                entity.Property(e => e.Count2).HasColumnName("COUNT2");
                entity.Property(e => e.InnerCount1).HasColumnName("INNER_COUNT1");
                entity.Property(e => e.InnerCount2).HasColumnName("INNER_COUNT2");
                entity.Property(e => e.Nozzle)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("NOZZLE");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Quality).HasColumnName("QUALITY");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Tankno)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Trk)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TRK");
            });

            modelBuilder.Entity<Sale>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("sales")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Session, "SALES_1");

                entity.HasIndex(e => new { e.Session, e.Productid }, "SALES_2");

                entity.HasIndex(e => new { e.Session, e.Productid, e.Doc, e.Cashflag, e.Price }, "SALES_3");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Amount).HasColumnName("AMOUNT");
                entity.Property(e => e.Billnum)
                    .HasColumnType("int(11)")
                    .HasColumnName("BILLNUM");
                entity.Property(e => e.Cash).HasColumnName("CASH");
                entity.Property(e => e.Cashcost).HasColumnName("CASHCOST");
                entity.Property(e => e.Cashflag)
                    .HasColumnType("int(11)")
                    .HasColumnName("CASHFLAG");
                entity.Property(e => e.Client)
                    .HasColumnType("int(11)")
                    .HasColumnName("CLIENT");
                entity.Property(e => e.Cost).HasColumnName("COST");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.Density).HasColumnName("DENSITY");
                entity.Property(e => e.Discount).HasColumnName("DISCOUNT");
                entity.Property(e => e.Doc)
                    .HasMaxLength(80)
                    .HasColumnName("DOC");
                entity.Property(e => e.Endremainder).HasColumnName("ENDREMAINDER");
                entity.Property(e => e.Host)
                    .HasColumnType("int(11)")
                    .HasColumnName("HOST");
                entity.Property(e => e.Preamount).HasColumnName("PREAMOUNT");
                entity.Property(e => e.Price).HasColumnName("PRICE");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Remainder).HasColumnName("REMAINDER");
                entity.Property(e => e.Saletag)
                    .HasColumnType("int(11)")
                    .HasColumnName("SALETAG");
                entity.Property(e => e.Scost).HasColumnName("SCOST");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Sprice).HasColumnName("SPRICE");
                entity.Property(e => e.Tankno)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Temperature).HasColumnName("TEMPERATURE");
                entity.Property(e => e.Trk)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TRK");
            });

            modelBuilder.Entity<SaleDatum>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToView("sale_data");

                entity.Property(e => e.Amount).HasColumnName("AMOUNT");
                entity.Property(e => e.Billnum)
                    .HasColumnType("int(11)")
                    .HasColumnName("BILLNUM");
                entity.Property(e => e.Cash).HasColumnName("CASH");
                entity.Property(e => e.Cashcost).HasColumnName("CASHCOST");
                entity.Property(e => e.Cashflag)
                    .HasColumnType("int(11)")
                    .HasColumnName("CASHFLAG");
                entity.Property(e => e.Client)
                    .HasColumnType("int(11)")
                    .HasColumnName("CLIENT");
                entity.Property(e => e.Cost).HasColumnName("COST");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATETIME")
                    .UseCollation("utf8_unicode_ci");
                entity.Property(e => e.Density).HasColumnName("DENSITY");
                entity.Property(e => e.Discount).HasColumnName("DISCOUNT");
                entity.Property(e => e.Doc)
                    .HasMaxLength(80)
                    .HasColumnName("DOC")
                    .UseCollation("utf8_unicode_ci");
                entity.Property(e => e.Endremainder).HasColumnName("ENDREMAINDER");
                entity.Property(e => e.Host)
                    .HasColumnType("int(11)")
                    .HasColumnName("HOST");
                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Preamount).HasColumnName("PREAMOUNT");
                entity.Property(e => e.Price).HasColumnName("PRICE");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Pump).HasColumnType("smallint(6)");
                entity.Property(e => e.Remainder).HasColumnName("REMAINDER");
                entity.Property(e => e.Saletag)
                    .HasColumnType("int(11)")
                    .HasColumnName("SALETAG");
                entity.Property(e => e.Scost).HasColumnName("SCOST");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Sprice).HasColumnName("SPRICE");
                entity.Property(e => e.Tankno)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Temperature).HasColumnName("TEMPERATURE");
                entity.Property(e => e.Trk)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TRK");
            });

            modelBuilder.Entity<SalesCounter>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("sales_counters")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Trk, e.Nozzle }, "TAXREG_1");

                entity.HasIndex(e => new { e.Trk, e.Tankno }, "TAXREG_2");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.CounterEnd).HasColumnName("COUNTER_END");
                entity.Property(e => e.CounterStart).HasColumnName("COUNTER_START");
                entity.Property(e => e.Ident)
                    .HasMaxLength(24)
                    .HasColumnName("ident");
                entity.Property(e => e.InnerCounterEnd).HasColumnName("INNER_COUNTER_END");
                entity.Property(e => e.InnerCounterStart).HasColumnName("INNER_COUNTER_START");
                entity.Property(e => e.Nozzle)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("NOZZLE");
                entity.Property(e => e.Quality).HasColumnName("QUALITY");
                entity.Property(e => e.Saletag)
                    .HasColumnType("int(11)")
                    .HasColumnName("SALETAG");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("session");
                entity.Property(e => e.Tankno)
                    .HasColumnType("int(11)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Trk)
                    .HasColumnType("int(11)")
                    .HasColumnName("TRK");
            });

            modelBuilder.Entity<SalesDelayed>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("sales_delayed");

                entity.Property(e => e.Amount).HasColumnName("AMOUNT");
                entity.Property(e => e.Billnum)
                    .HasColumnType("int(11)")
                    .HasColumnName("BILLNUM");
                entity.Property(e => e.Cash).HasColumnName("CASH");
                entity.Property(e => e.Cashcost).HasColumnName("CASHCOST");
                entity.Property(e => e.Cashflag)
                    .HasColumnType("int(11)")
                    .HasColumnName("CASHFLAG");
                entity.Property(e => e.Client)
                    .HasColumnType("int(11)")
                    .HasColumnName("CLIENT");
                entity.Property(e => e.Cost).HasColumnName("COST");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATETIME")
                    .UseCollation("utf8_unicode_ci");
                entity.Property(e => e.Density).HasColumnName("DENSITY");
                entity.Property(e => e.Discount).HasColumnName("DISCOUNT");
                entity.Property(e => e.Doc)
                    .HasMaxLength(80)
                    .HasColumnName("DOC")
                    .UseCollation("utf8_unicode_ci");
                entity.Property(e => e.Endremainder).HasColumnName("ENDREMAINDER");
                entity.Property(e => e.Host)
                    .HasColumnType("int(11)")
                    .HasColumnName("HOST");
                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Preamount).HasColumnName("PREAMOUNT");
                entity.Property(e => e.Price).HasColumnName("PRICE");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Remainder).HasColumnName("REMAINDER");
                entity.Property(e => e.Saletag)
                    .HasColumnType("int(11)")
                    .HasColumnName("SALETAG");
                entity.Property(e => e.Scost).HasColumnName("SCOST");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Sprice).HasColumnName("SPRICE");
                entity.Property(e => e.Tankno)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Temperature).HasColumnName("TEMPERATURE");
                entity.Property(e => e.Trk)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TRK");
            });

            modelBuilder.Entity<SalesIngredient>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("sales_ingredient")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                entity.Property(e => e.Amount).HasColumnName("amount");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("createtime");
                entity.Property(e => e.HostId)
                    .HasColumnType("int(11)")
                    .HasColumnName("host_id");
                entity.Property(e => e.IngrId)
                    .HasColumnType("int(11)")
                    .HasColumnName("ingr_id");
                entity.Property(e => e.Price).HasColumnName("price");
                entity.Property(e => e.ProductId)
                    .HasColumnType("int(11)")
                    .HasColumnName("product_id");
                entity.Property(e => e.SaleId)
                    .HasColumnType("int(11)")
                    .HasColumnName("sale_id");
                entity.Property(e => e.SessionId)
                    .HasColumnType("int(11)")
                    .HasColumnName("session_id");
            });

            modelBuilder.Entity<SalesLoyalty>(entity =>
            {
                entity.HasKey(e => e.Saletag).HasName("PRIMARY");

                entity
                    .ToTable("sales_loyalty")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Saletag)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("saletag");
                entity.Property(e => e.BonusAmount)
                    .HasColumnType("int(11)")
                    .HasColumnName("bonus_amount");
                entity.Property(e => e.CardData)
                    .HasMaxLength(30)
                    .HasColumnName("card_data");
            });

            modelBuilder.Entity<Saletag>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("saletag")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
            });

            modelBuilder.Entity<Section>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("sections")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Description)
                    .HasMaxLength(160)
                    .HasColumnName("DESCRIPTION");
                entity.Property(e => e.Longname)
                    .HasMaxLength(160)
                    .HasColumnName("LONGNAME");
                entity.Property(e => e.Name)
                    .HasMaxLength(40)
                    .HasColumnName("NAME");
                entity.Property(e => e.Tax)
                    .HasColumnType("int(11)")
                    .HasColumnName("TAX");
            });

            modelBuilder.Entity<Session>(entity =>
            {
                entity.HasKey(e => e.Session1).HasName("PRIMARY");

                entity
                    .ToTable("sessions")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Sessionname, "SESSIONS_1");

                entity.Property(e => e.Session1)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Datetime1)
                    .HasMaxLength(24)
                    .HasColumnName("DATETIME1");
                entity.Property(e => e.Datetime2)
                    .HasMaxLength(24)
                    .HasColumnName("DATETIME2");
                entity.Property(e => e.Dt1)
                    .HasColumnType("datetime")
                    .HasColumnName("DT1");
                entity.Property(e => e.Dt2)
                    .HasColumnType("datetime")
                    .HasColumnName("DT2");
                entity.Property(e => e.Operator)
                    .HasColumnType("int(11)")
                    .HasColumnName("OPERATOR");
                entity.Property(e => e.Rep)
                    .HasColumnType("int(11)")
                    .HasColumnName("REP");
                entity.Property(e => e.Sessionname)
                    .HasMaxLength(40)
                    .HasColumnName("SESSIONNAME");
                entity.Property(e => e.Userid)
                    .HasColumnType("int(11)")
                    .HasColumnName("USERID");
            });

            modelBuilder.Entity<Sheet>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("sheet")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Doc, "SHEET_1");

                entity.HasIndex(e => new { e.Client, e.Doc }, "SHEET_2");

                entity.HasIndex(e => new { e.Productid, e.Cashflag }, "SHEET_3");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Addition)
                    .HasColumnType("blob")
                    .HasColumnName("ADDITION");
                entity.Property(e => e.Amount).HasColumnName("AMOUNT");
                entity.Property(e => e.Cashflag)
                    .HasColumnType("int(11)")
                    .HasColumnName("CASHFLAG");
                entity.Property(e => e.Client)
                    .HasColumnType("int(11)")
                    .HasColumnName("CLIENT");
                entity.Property(e => e.Createtime)
                    .HasMaxLength(24)
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.Credit).HasColumnName("CREDIT");
                entity.Property(e => e.Debit).HasColumnName("DEBIT");
                entity.Property(e => e.Discount).HasColumnName("DISCOUNT");
                entity.Property(e => e.Doc)
                    .HasMaxLength(80)
                    .HasColumnName("DOC");
                entity.Property(e => e.Flag)
                    .HasColumnType("int(11)")
                    .HasColumnName("FLAG");
                entity.Property(e => e.Name)
                    .HasMaxLength(80)
                    .HasColumnName("NAME");
                entity.Property(e => e.Price).HasColumnName("PRICE");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Tankno)
                    .HasColumnType("int(11)")
                    .HasColumnName("TANKNO");
            });

            modelBuilder.Entity<Talon>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("talons")
                    .HasCharSet("cp1251")
                    .UseCollation("cp1251_general_ci");

                entity.Property(e => e.Barcode)
                    .HasMaxLength(24)
                    .HasColumnName("BARCODE");
                entity.Property(e => e.Createtime)
                    .ValueGeneratedOnAddOrUpdate()
                    .HasDefaultValueSql("CURRENT_TIMESTAMP")
                    .HasColumnType("timestamp")
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.Dtime)
                    .HasMaxLength(24)
                    .HasColumnName("DTIME");
                entity.Property(e => e.Emitent)
                    .HasMaxLength(10)
                    .HasColumnName("EMITENT");
                entity.Property(e => e.Emitentname)
                    .HasMaxLength(80)
                    .HasColumnName("EMITENTNAME");
                entity.Property(e => e.Flags)
                    .HasColumnType("int(11)")
                    .HasColumnName("FLAGS");
                entity.Property(e => e.Host)
                    .HasColumnType("int(11)")
                    .HasColumnName("HOST");
                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Nominal)
                    .HasColumnType("int(11)")
                    .HasColumnName("NOMINAL");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Returnvol).HasColumnName("RETURNVOL");
                entity.Property(e => e.Session)
                    .HasColumnType("int(11)")
                    .HasColumnName("SESSION");
                entity.Property(e => e.Transact)
                    .HasMaxLength(24)
                    .HasColumnName("TRANSACT");
                entity.Property(e => e.Trk)
                    .HasColumnType("int(11)")
                    .HasColumnName("TRK");
                entity.Property(e => e.Type)
                    .HasColumnType("int(11)")
                    .HasColumnName("TYPE");
                entity.Property(e => e.Volume).HasColumnName("VOLUME");
            });

            modelBuilder.Entity<TalonsBlacklist>(entity =>
            {
                entity
                    .HasNoKey()
                    .ToTable("talons_blacklist")
                    .HasCharSet("cp1251")
                    .UseCollation("cp1251_general_ci");

                entity.Property(e => e.Barcode1)
                    .HasMaxLength(24)
                    .HasColumnName("BARCODE1");
                entity.Property(e => e.Barcode2)
                    .HasMaxLength(24)
                    .HasColumnName("BARCODE2");
                entity.Property(e => e.Createtime)
                    .ValueGeneratedOnAddOrUpdate()
                    .HasDefaultValueSql("CURRENT_TIMESTAMP")
                    .HasColumnType("timestamp")
                    .HasColumnName("CREATETIME");
            });

            modelBuilder.Entity<Tank>(entity =>
            {
                entity.HasKey(e => e.Tankno).HasName("PRIMARY");

                entity
                    .ToTable("tank")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Tankno)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Amount).HasColumnName("AMOUNT");
                entity.Property(e => e.Amountmm).HasColumnName("AMOUNTMM");
                entity.Property(e => e.Bookamount).HasColumnName("BOOKAMOUNT");
                entity.Property(e => e.Density).HasColumnName("DENSITY");
                entity.Property(e => e.Density15).HasColumnName("DENSITY15");
                entity.Property(e => e.Mass).HasColumnName("MASS");
                entity.Property(e => e.Productgroup)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTGROUP");
                entity.Property(e => e.Productid)
                    .HasColumnType("int(11)")
                    .HasColumnName("PRODUCTID");
                entity.Property(e => e.Temperature).HasColumnName("TEMPERATURE");
                entity.Property(e => e.Volume15).HasColumnName("VOLUME15");
                entity.Property(e => e.Water).HasColumnName("WATER");
                entity.Property(e => e.Watermm).HasColumnName("WATERMM");
            });

            modelBuilder.Entity<Tankmonitor>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("tankmonitor")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasComment("Primary key")
                    .HasColumnType("smallint(6)");
                entity.Property(e => e.Density).HasComment("Current density of fuel product in tank in kg/m3 units");
                entity.Property(e => e.IsDelivery)
                    .HasComment("Flag showing whether delivery of fuel product into tank is going")
                    .HasColumnType("bit(1)");
                entity.Property(e => e.Mass).HasComment("Current mass of fuel in tank in kg");
                entity.Property(e => e.PipeVolume).HasComment("Volume of pipe from tank to pump");
                entity.Property(e => e.ProductHeight).HasComment("Current height of fuel product in tank in mm");
                entity.Property(e => e.ProductId)
                    .HasComment("Fuel product identification number")
                    .HasColumnType("bigint(11)");
                entity.Property(e => e.ProductName)
                    .HasComment("Fuel product name")
                    .HasColumnType("text");
                entity.Property(e => e.ProductVolume).HasComment("Current volume of fuel product in tank in liters");
                entity.Property(e => e.TankHeight).HasComment("Total height of tank in mm");
                entity.Property(e => e.TankId)
                    .HasComment("Tank identification number")
                    .HasColumnType("int(11)");
                entity.Property(e => e.TankVolume).HasComment("Total volume of tank in liters");
                entity.Property(e => e.TempCompVolume).HasComment("Current temperature compensated volume (15 degrees Celcium) of fuel product in tank in liters");
                entity.Property(e => e.Temperature).HasComment("Current temperature of fuel product in tank in degrees Celcium");
                entity.Property(e => e.Ullage).HasComment("Current volume of empty space in tank in liters");
                entity.Property(e => e.WaterHeight).HasComment("Current height of water in tank in mm");
                entity.Property(e => e.WaterVolume).HasComment("Current volume of water in tank in liters");
            });

            modelBuilder.Entity<Tax>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("tax")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Name)
                    .HasMaxLength(24)
                    .HasColumnName("NAME");
                entity.Property(e => e.Rate).HasColumnName("RATE");
            });

            modelBuilder.Entity<Taxreg>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("taxreg")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => e.Doc, "TAXREG_1");

                entity.HasIndex(e => e.Client, "TAXREG_2");

                entity.HasIndex(e => e.Createtime, "TAXREG_3");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Amount).HasColumnName("AMOUNT");
                entity.Property(e => e.Cashform)
                    .HasColumnType("int(11)")
                    .HasColumnName("CASHFORM");
                entity.Property(e => e.Client)
                    .HasColumnType("int(11)")
                    .HasColumnName("CLIENT");
                entity.Property(e => e.Cost).HasColumnName("COST");
                entity.Property(e => e.Createtime)
                    .HasColumnType("datetime")
                    .HasColumnName("CREATETIME");
                entity.Property(e => e.Discount).HasColumnName("DISCOUNT");
                entity.Property(e => e.Doc)
                    .HasMaxLength(80)
                    .HasColumnName("DOC");
                entity.Property(e => e.Name)
                    .HasMaxLength(80)
                    .HasColumnName("NAME");
                entity.Property(e => e.Price).HasColumnName("PRICE");
                entity.Property(e => e.Productname)
                    .HasMaxLength(80)
                    .HasColumnName("PRODUCTNAME");
                entity.Property(e => e.Unit)
                    .HasMaxLength(24)
                    .HasColumnName("UNIT");
            });

            modelBuilder.Entity<Trk>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("trk")
                    .UseCollation("utf8_unicode_ci");

                entity.HasIndex(e => new { e.Trk1, e.Nozzle }, "TAXREG_1");

                entity.HasIndex(e => new { e.Trk1, e.Tankno }, "TAXREG_2");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Counter).HasColumnName("COUNTER");
                entity.Property(e => e.InnerCounter).HasColumnName("INNER_COUNTER");
                entity.Property(e => e.Nozzle)
                    .HasColumnType("smallint(6)")
                    .HasColumnName("NOZZLE");
                entity.Property(e => e.Quality).HasColumnName("QUALITY");
                entity.Property(e => e.Tankno)
                    .HasColumnType("int(11)")
                    .HasColumnName("TANKNO");
                entity.Property(e => e.Trk1)
                    .HasColumnType("int(11)")
                    .HasColumnName("TRK");
            });

            modelBuilder.Entity<VersionTable>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PRIMARY");

                entity
                    .ToTable("versions")
                    .UseCollation("utf8_unicode_ci");

                entity.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                entity.Property(e => e.Name)
                    .HasMaxLength(20)
                    .HasColumnName("NAME");
                entity.Property(e => e.Vers)
                    .HasColumnType("int(11)")
                    .HasColumnName("VERS");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
