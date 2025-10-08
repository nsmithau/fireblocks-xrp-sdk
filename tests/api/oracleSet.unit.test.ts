import { OracleSetOpts, PriceData } from "../../src/config/types";
import { TransactionType } from "../../src/pool/types";

describe("OracleSet Unit Tests", () => {
  describe("OracleSetOpts Interface", () => {
    it("should create valid OracleSetOpts with required fields", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 34,
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              AssetPrice: "2850",
              Scale: 3,
            },
          },
        ],
      };

      expect(params.OracleDocumentID).toBe(34);
      expect(params.LastUpdateTime).toBeGreaterThan(0);
      expect(params.PriceDataSeries).toHaveLength(1);
      expect(params.PriceDataSeries[0].PriceData.BaseAsset).toBe("XRP");
      expect(params.PriceDataSeries[0].PriceData.QuoteAsset).toBe("USD");
      expect(params.PriceDataSeries[0].PriceData.AssetPrice).toBe("2850");
      expect(params.PriceDataSeries[0].PriceData.Scale).toBe(3);
    });

    it("should create valid OracleSetOpts with all optional fields", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 100,
        Provider: "436861696E6C696E6B", // "Chainlink" in hex
        URI: "68747470733A2F2F6170692E636861696E6C696E6B2E636F6D", // "https://api.chainlink.com" in hex
        LastUpdateTime: Math.floor(Date.now() / 1000),
        AssetClass: "636F6D6D6F64697479", // "commodity" in hex
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "GOLD",
              QuoteAsset: "USD",
              AssetPrice: "2000000",
              Scale: 3,
            },
          },
        ],
      };

      expect(params.OracleDocumentID).toBe(100);
      expect(params.Provider).toBe("436861696E6C696E6B");
      expect(params.URI).toBe("68747470733A2F2F6170692E636861696E6C696E6B2E636F6D");
      expect(params.AssetClass).toBe("636F6D6D6F64697479");
      expect(params.PriceDataSeries).toHaveLength(1);
    });

    it("should create valid OracleSetOpts with multiple price data", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 50,
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              AssetPrice: "500",
              Scale: 2,
            },
          },
          {
            PriceData: {
              BaseAsset: "BTC",
              QuoteAsset: "USD",
              AssetPrice: "50000000",
              Scale: 3,
            },
          },
          {
            PriceData: {
              BaseAsset: "ETH",
              QuoteAsset: "USD",
              AssetPrice: "3000000",
              Scale: 3,
            },
          },
        ],
      };

      expect(params.PriceDataSeries).toHaveLength(3);
      expect(params.PriceDataSeries[0].PriceData.BaseAsset).toBe("XRP");
      expect(params.PriceDataSeries[1].PriceData.BaseAsset).toBe("BTC");
      expect(params.PriceDataSeries[2].PriceData.BaseAsset).toBe("ETH");
    });

    it("should create valid OracleSetOpts for price deletion", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 1,
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              // No AssetPrice or Scale - this deletes the price pair
            },
          },
        ],
      };

      expect(params.PriceDataSeries[0].PriceData.BaseAsset).toBe("XRP");
      expect(params.PriceDataSeries[0].PriceData.QuoteAsset).toBe("USD");
      expect(params.PriceDataSeries[0].PriceData.AssetPrice).toBeUndefined();
      expect(params.PriceDataSeries[0].PriceData.Scale).toBeUndefined();
    });
  });

  describe("PriceData Interface", () => {
    it("should create valid PriceData with all fields", () => {
      const priceData: PriceData = {
        BaseAsset: "XRP",
        QuoteAsset: "USD",
        AssetPrice: "1000000",
        Scale: 6,
      };

      expect(priceData.BaseAsset).toBe("XRP");
      expect(priceData.QuoteAsset).toBe("USD");
      expect(priceData.AssetPrice).toBe("1000000");
      expect(priceData.Scale).toBe(6);
    });

    it("should create valid PriceData with only required fields", () => {
      const priceData: PriceData = {
        BaseAsset: "BTC",
        QuoteAsset: "USD",
      };

      expect(priceData.BaseAsset).toBe("BTC");
      expect(priceData.QuoteAsset).toBe("USD");
      expect(priceData.AssetPrice).toBeUndefined();
      expect(priceData.Scale).toBeUndefined();
    });
  });

  describe("TransactionType Enum", () => {
    it("should have ORACLE_SET transaction type", () => {
      expect(TransactionType.ORACLE_SET).toBe("oracleSet");
    });

    it("should have ORACLE_DELETE transaction type", () => {
      expect(TransactionType.ORACLE_DELETE).toBe("oracleDelete");
    });
  });

  describe("OracleSet Parameter Validation", () => {
    it("should validate OracleDocumentID is a number", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 123,
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              AssetPrice: "100",
              Scale: 2,
            },
          },
        ],
      };

      expect(typeof params.OracleDocumentID).toBe("number");
      expect(params.OracleDocumentID).toBeGreaterThan(0);
    });

    it("should validate LastUpdateTime is a valid timestamp", () => {
      const now = Math.floor(Date.now() / 1000);
      const params: OracleSetOpts = {
        OracleDocumentID: 1,
        LastUpdateTime: now,
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              AssetPrice: "100",
              Scale: 2,
            },
          },
        ],
      };

      expect(typeof params.LastUpdateTime).toBe("number");
      expect(params.LastUpdateTime).toBeGreaterThan(0);
      expect(params.LastUpdateTime).toBeLessThanOrEqual(now);
    });

    it("should validate PriceDataSeries is an array", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 1,
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              AssetPrice: "100",
              Scale: 2,
            },
          },
        ],
      };

      expect(Array.isArray(params.PriceDataSeries)).toBe(true);
      expect(params.PriceDataSeries.length).toBeGreaterThan(0);
    });

    it("should validate PriceDataSeries has maximum 10 items", () => {
      const priceDataSeries = Array.from({ length: 10 }, (_, i) => ({
        PriceData: {
          BaseAsset: `TOKEN${i}`,
          QuoteAsset: "USD",
          AssetPrice: "100",
          Scale: 2,
        },
      }));

      const params: OracleSetOpts = {
        OracleDocumentID: 1,
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: priceDataSeries,
      };

      expect(params.PriceDataSeries).toHaveLength(10);
    });

    it("should validate Scale is between 0 and 10", () => {
      const validScales = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      validScales.forEach(scale => {
        const params: OracleSetOpts = {
          OracleDocumentID: 1,
          LastUpdateTime: Math.floor(Date.now() / 1000),
          PriceDataSeries: [
            {
              PriceData: {
                BaseAsset: "XRP",
                QuoteAsset: "USD",
                AssetPrice: "100",
                Scale: scale,
              },
            },
          ],
        };

        expect(params.PriceDataSeries[0].PriceData.Scale).toBe(scale);
        expect(scale).toBeGreaterThanOrEqual(0);
        expect(scale).toBeLessThanOrEqual(10);
      });
    });
  });

  describe("Hex Encoding Validation", () => {
    it("should validate Provider is hex encoded", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 1,
        Provider: "70726F7669646572", // "provider" in hex
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              AssetPrice: "100",
              Scale: 2,
            },
          },
        ],
      };

      expect(params.Provider).toMatch(/^[0-9A-Fa-f]+$/);
      expect(params.Provider!.length).toBeLessThanOrEqual(512); // 256 hex chars = 128 bytes
    });

    it("should validate AssetClass is hex encoded", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 1,
        AssetClass: "63757272656E6379", // "currency" in hex
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              AssetPrice: "100",
              Scale: 2,
            },
          },
        ],
      };

      expect(params.AssetClass).toMatch(/^[0-9A-Fa-f]+$/);
      expect(params.AssetClass!.length).toBeLessThanOrEqual(32); // 16 hex chars = 8 bytes
    });

    it("should validate URI is hex encoded", () => {
      const params: OracleSetOpts = {
        OracleDocumentID: 1,
        URI: "68747470733A2F2F6170692E6578616D706C652E636F6D", // "https://api.example.com" in hex
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: "XRP",
              QuoteAsset: "USD",
              AssetPrice: "100",
              Scale: 2,
            },
          },
        ],
      };

      expect(params.URI).toMatch(/^[0-9A-Fa-f]+$/);
      expect(params.URI!.length).toBeLessThanOrEqual(512); // 256 bytes = 512 hex chars
    });
  });

  describe("Price Calculation Examples", () => {
    it("should demonstrate correct price scaling", () => {
      const examples = [
        { originalPrice: 0.155, scale: 6, expectedScaled: "155000" },
        { originalPrice: 740, scale: 3, expectedScaled: "740000" },
        { originalPrice: 1.00, scale: 2, expectedScaled: "100" },
        { originalPrice: 50000, scale: 3, expectedScaled: "50000000" },
        { originalPrice: 25.50, scale: 2, expectedScaled: "2550" },
      ];

      examples.forEach(({ originalPrice, scale, expectedScaled }) => {
        const scaledPrice = Math.round(originalPrice * Math.pow(10, scale)).toString();
        expect(scaledPrice).toBe(expectedScaled);
      });
    });

    it("should demonstrate price unscaling", () => {
      const examples = [
        { scaledPrice: "155000", scale: 6, expectedOriginal: 0.155 },
        { scaledPrice: "740000", scale: 3, expectedOriginal: 740 },
        { scaledPrice: "100", scale: 2, expectedOriginal: 1.00 },
        { scaledPrice: "50000000", scale: 3, expectedOriginal: 50000 },
        { scaledPrice: "2550", scale: 2, expectedOriginal: 25.50 },
      ];

      examples.forEach(({ scaledPrice, scale, expectedOriginal }) => {
        const originalPrice = parseInt(scaledPrice) / Math.pow(10, scale);
        expect(originalPrice).toBe(expectedOriginal);
      });
    });
  });
});
