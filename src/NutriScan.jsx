import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Rodape from "./Rodape";

const TACO = {
  "arroz, integral, cozido": { kcal: 124, prot: 2.6, lip: 1.0, carb: 25.8, fibra: 2.7 },
  "arroz, integral, cru": { kcal: 360, prot: 7.3, lip: 1.9, carb: 77.5, fibra: 4.8 },
  "arroz, tipo 1, cozido": { kcal: 128, prot: 2.5, lip: 0.2, carb: 28.1, fibra: 1.6 },
  "arroz, tipo 1, cru": { kcal: 358, prot: 7.2, lip: 0.3, carb: 78.8, fibra: 1.6 },
  "arroz, tipo 2, cozido": { kcal: 130, prot: 2.6, lip: 0.4, carb: 28.2, fibra: 1.1 },
  "arroz, tipo 2, cru": { kcal: 358, prot: 7.2, lip: 0.3, carb: 78.9, fibra: 1.7 },
  "aveia, flocos, crua": { kcal: 394, prot: 13.9, lip: 8.5, carb: 66.6, fibra: 9.1 },
  "biscoito, doce, maisena": { kcal: 443, prot: 8.1, lip: 12.0, carb: 75.2, fibra: 2.1 },
  "biscoito, doce, recheado com chocolate": { kcal: 472, prot: 6.4, lip: 19.6, carb: 70.5, fibra: 3.0 },
  "biscoito, doce, recheado com morango": { kcal: 471, prot: 5.7, lip: 19.6, carb: 71.0, fibra: 1.5 },
  "biscoito, doce, wafer, recheado de chocolate": { kcal: 502, prot: 5.6, lip: 24.7, carb: 67.5, fibra: 1.8 },
  "biscoito, doce, wafer, recheado de morango": { kcal: 513, prot: 4.5, lip: 26.4, carb: 67.4, fibra: 0.8 },
  "biscoito, salgado, cream cracker": { kcal: 432, prot: 10.1, lip: 14.4, carb: 68.7, fibra: 2.5 },
  "bolo, mistura para": { kcal: 419, prot: 6.2, lip: 6.1, carb: 84.7, fibra: 1.7 },
  "bolo, pronto, aipim": { kcal: 324, prot: 4.4, lip: 12.7, carb: 47.9, fibra: 0.7 },
  "bolo, pronto, chocolate": { kcal: 410, prot: 6.2, lip: 18.5, carb: 54.7, fibra: 1.4 },
  "bolo, pronto, coco": { kcal: 333, prot: 5.7, lip: 11.3, carb: 52.3, fibra: 1.1 },
  "bolo, pronto, milho": { kcal: 311, prot: 4.8, lip: 12.4, carb: 45.1, fibra: 0.7 },
  "canjica, branca, crua": { kcal: 358, prot: 7.2, lip: 1.0, carb: 78.1, fibra: 5.5 },
  "canjica, com leite integral": { kcal: 112, prot: 2.4, lip: 1.2, carb: 23.6, fibra: 1.2 },
  "cereais, milho, flocos, com sal": { kcal: 370, prot: 7.3, lip: 1.6, carb: 80.8, fibra: 5.3 },
  "cereais, milho, flocos, sem sal": { kcal: 363, prot: 6.9, lip: 1.2, carb: 80.4, fibra: 1.8 },
  "cereais, mingau, milho, infantil": { kcal: 394, prot: 6.4, lip: 1.1, carb: 87.3, fibra: 3.2 },
  "cereais, mistura para vitamina": { kcal: 381, prot: 8.9, lip: 2.1, carb: 81.6, fibra: 5.0 },
  "cereal matinal, milho": { kcal: 365, prot: 7.2, lip: 1.0, carb: 83.8, fibra: 4.1 },
  "cereal matinal, milho, açúcar": { kcal: 377, prot: 4.7, lip: 0.7, carb: 88.8, fibra: 2.1 },
  "creme de arroz, pó": { kcal: 386, prot: 7.0, lip: 1.2, carb: 83.9, fibra: 1.1 },
  "creme de milho, pó": { kcal: 333, prot: 4.8, lip: 1.6, carb: 86.1, fibra: 3.7 },
  "curau, milho verde": { kcal: 78, prot: 2.4, lip: 1.6, carb: 13.9, fibra: 0.5 },
  "curau, milho verde, mistura para": { kcal: 402, prot: 2.2, lip: 13.4, carb: 79.8, fibra: 2.5 },
  "farinha, de arroz, enriquecida": { kcal: 363, prot: 1.3, lip: 0.3, carb: 85.5, fibra: 0.6 },
  "farinha, de centeio, integral": { kcal: 336, prot: 12.5, lip: 1.8, carb: 73.3, fibra: 15.5 },
  "farinha, de milho, amarela": { kcal: 351, prot: 7.2, lip: 1.5, carb: 79.1, fibra: 5.5 },
  "farinha, de rosca": { kcal: 371, prot: 11.4, lip: 1.5, carb: 75.8, fibra: 4.8 },
  "farinha, de trigo": { kcal: 360, prot: 9.8, lip: 1.4, carb: 75.1, fibra: 2.3 },
  "farinha, láctea, de cereais": { kcal: 415, prot: 11.9, lip: 5.8, carb: 77.8, fibra: 1.9 },
  "lasanha, massa fresca, cozida": { kcal: 164, prot: 5.8, lip: 1.2, carb: 32.5, fibra: 1.6 },
  "lasanha, massa fresca, crua": { kcal: 220, prot: 7.0, lip: 1.3, carb: 45.1, fibra: 1.6 },
  "macarrão, instantâneo": { kcal: 436, prot: 8.8, lip: 17.2, carb: 62.4, fibra: 5.6 },
  "macarrão, trigo, cru": { kcal: 371, prot: 10.0, lip: 1.3, carb: 77.9, fibra: 2.9 },
  "macarrão, trigo, cru, com ovos": { kcal: 371, prot: 10.3, lip: 2.0, carb: 76.6, fibra: 2.3 },
  "milho, amido, cru": { kcal: 361, prot: 0.6, lip: 0, carb: 87.1, fibra: 0.7 },
  "milho, fubá, cru": { kcal: 353, prot: 7.2, lip: 1.9, carb: 78.9, fibra: 4.7 },
  "milho, verde, cru": { kcal: 138, prot: 6.6, lip: 0.6, carb: 28.6, fibra: 3.9 },
  "milho, verde, enlatado, drenado": { kcal: 98, prot: 3.2, lip: 2.4, carb: 17.1, fibra: 4.6 },
  "mingau tradicional, pó": { kcal: 373, prot: 0.6, lip: 0.4, carb: 89.3, fibra: 0.9 },
  "pamonha, barra para cozimento": { kcal: 171, prot: 2.6, lip: 4.8, carb: 30.7, fibra: 2.4 },
  "pão, aveia, forma": { kcal: 343, prot: 12.4, lip: 5.7, carb: 59.6, fibra: 6.0 },
  "pão, de soja": { kcal: 309, prot: 11.3, lip: 3.6, carb: 56.5, fibra: 5.7 },
  "pão, glúten, forma": { kcal: 253, prot: 12.0, lip: 2.7, carb: 44.1, fibra: 2.5 },
  "pão, milho, forma": { kcal: 292, prot: 8.3, lip: 3.1, carb: 56.4, fibra: 4.3 },
  "pão, trigo, forma, integral": { kcal: 253, prot: 9.4, lip: 3.7, carb: 49.9, fibra: 6.9 },
  "pão, trigo, francês": { kcal: 300, prot: 8.0, lip: 3.1, carb: 58.6, fibra: 2.3 },
  "pão, trigo, sovado": { kcal: 311, prot: 8.4, lip: 2.8, carb: 61.5, fibra: 2.4 },
  "pastel, de carne, cru": { kcal: 289, prot: 10.7, lip: 8.8, carb: 42.0, fibra: 1.0 },
  "pastel, de carne, frito": { kcal: 388, prot: 10.1, lip: 20.1, carb: 43.8, fibra: 1.0 },
  "pastel, de queijo, cru": { kcal: 308, prot: 9.9, lip: 9.6, carb: 45.9, fibra: 1.1 },
  "pastel, de queijo, frito": { kcal: 422, prot: 8.7, lip: 22.7, carb: 48.1, fibra: 0.9 },
  "pastel, massa, crua": { kcal: 310, prot: 6.9, lip: 5.5, carb: 57.4, fibra: 1.4 },
  "pastel, massa, frita": { kcal: 570, prot: 6.0, lip: 40.9, carb: 49.3, fibra: 1.3 },
  "pipoca, com óleo de soja, sem sal": { kcal: 448, prot: 9.9, lip: 15.9, carb: 70.3, fibra: 14.3 },
  "polenta, pré-cozida": { kcal: 103, prot: 2.3, lip: 0.3, carb: 23.3, fibra: 2.4 },
  "torrada, pão francês": { kcal: 377, prot: 10.5, lip: 3.3, carb: 74.6, fibra: 3.4 },
  "abóbora, cabotian, cozida": { kcal: 48, prot: 1.4, lip: 0.7, carb: 10.8, fibra: 2.5 },
  "abóbora, cabotian, crua": { kcal: 39, prot: 1.7, lip: 0.5, carb: 8.4, fibra: 2.2 },
  "abóbora, menina brasileira, crua": { kcal: 14, prot: 0.6, lip: 0, carb: 3.3, fibra: 1.2 },
  "abóbora, moranga, crua": { kcal: 12, prot: 1.0, lip: 0.1, carb: 2.7, fibra: 1.7 },
  "abóbora, moranga, refogada": { kcal: 29, prot: 0.4, lip: 0.8, carb: 6.0, fibra: 1.5 },
  "abóbora, pescoço, crua": { kcal: 24, prot: 0.7, lip: 0.1, carb: 6.1, fibra: 2.3 },
  "abobrinha, italiana, cozida": { kcal: 15, prot: 1.1, lip: 0.2, carb: 3.0, fibra: 1.6 },
  "abobrinha, italiana, crua": { kcal: 19, prot: 1.1, lip: 0.1, carb: 4.3, fibra: 1.4 },
  "abobrinha, italiana, refogada": { kcal: 24, prot: 1.1, lip: 0.8, carb: 4.2, fibra: 1.4 },
  "abobrinha, paulista, crua": { kcal: 31, prot: 0.6, lip: 0.1, carb: 7.9, fibra: 2.6 },
  "acelga, crua": { kcal: 21, prot: 1.4, lip: 0.1, carb: 4.6, fibra: 1.1 },
  "agrião, cru": { kcal: 17, prot: 2.7, lip: 0.2, carb: 2.3, fibra: 2.1 },
  "aipo, cru": { kcal: 19, prot: 0.8, lip: 0.1, carb: 4.3, fibra: 1.0 },
  "alface, americana, crua": { kcal: 9, prot: 0.6, lip: 0.1, carb: 1.7, fibra: 1.0 },
  "alface, crespa, crua": { kcal: 11, prot: 1.3, lip: 0.2, carb: 1.7, fibra: 1.8 },
  "alface, lisa, crua": { kcal: 14, prot: 1.7, lip: 0.1, carb: 2.4, fibra: 2.3 },
  "alface, roxa, crua": { kcal: 13, prot: 0.9, lip: 0.2, carb: 2.5, fibra: 2.0 },
  "alfavaca, crua": { kcal: 29, prot: 2.7, lip: 0.5, carb: 5.2, fibra: 4.1 },
  "alho, cru": { kcal: 113, prot: 7.0, lip: 0.2, carb: 23.9, fibra: 4.3 },
  "alho-poró, cru": { kcal: 32, prot: 1.4, lip: 0.1, carb: 6.9, fibra: 2.5 },
  "almeirão, cru": { kcal: 18, prot: 1.8, lip: 0.2, carb: 3.3, fibra: 2.6 },
  "almeirão, refogado": { kcal: 65, prot: 1.7, lip: 4.8, carb: 5.7, fibra: 3.4 },
  "batata, baroa, cozida": { kcal: 80, prot: 0.9, lip: 0.2, carb: 18.9, fibra: 1.8 },
  "batata, baroa, crua": { kcal: 101, prot: 1.0, lip: 0.2, carb: 24.0, fibra: 2.1 },
  "batata, doce, cozida": { kcal: 77, prot: 0.6, lip: 0.1, carb: 18.4, fibra: 2.2 },
  "batata, doce, crua": { kcal: 118, prot: 1.3, lip: 0.1, carb: 28.2, fibra: 2.6 },
  "batata, frita, tipo chips": { kcal: 543, prot: 5.6, lip: 36.6, carb: 51.2, fibra: 2.5 },
  "batata, inglesa, cozida": { kcal: 52, prot: 1.2, lip: 0, carb: 11.9, fibra: 1.3 },
  "batata, inglesa, crua": { kcal: 64, prot: 1.8, lip: 0, carb: 14.7, fibra: 1.2 },
  "batata, inglesa, frita": { kcal: 267, prot: 5.0, lip: 13.1, carb: 35.6, fibra: 8.1 },
  "batata, inglesa, sauté": { kcal: 68, prot: 1.3, lip: 0.9, carb: 14.1, fibra: 1.4 },
  "berinjela, cozida": { kcal: 19, prot: 0.7, lip: 0.1, carb: 4.5, fibra: 2.5 },
  "berinjela, crua": { kcal: 20, prot: 1.2, lip: 0.1, carb: 4.4, fibra: 2.9 },
  "beterraba, cozida": { kcal: 32, prot: 1.3, lip: 0.1, carb: 7.2, fibra: 1.9 },
  "beterraba, crua": { kcal: 49, prot: 1.9, lip: 0.1, carb: 11.1, fibra: 3.4 },
  "biscoito, polvilho doce": { kcal: 438, prot: 1.3, lip: 12.2, carb: 80.5, fibra: 1.2 },
  "brócolis, cozido": { kcal: 25, prot: 2.1, lip: 0.5, carb: 4.4, fibra: 3.4 },
  "brócolis, cru": { kcal: 25, prot: 3.6, lip: 0.3, carb: 4.0, fibra: 2.9 },
  "cará, cozido": { kcal: 78, prot: 1.5, lip: 0.1, carb: 18.9, fibra: 2.6 },
  "cará, cru": { kcal: 96, prot: 2.3, lip: 0.1, carb: 23.0, fibra: 7.3 },
  "caruru, cru": { kcal: 34, prot: 3.2, lip: 0.6, carb: 6.0, fibra: 4.5 },
  "catalonha, crua": { kcal: 24, prot: 1.9, lip: 0.3, carb: 4.8, fibra: 2.0 },
  "catalonha, refogada": { kcal: 63, prot: 2.0, lip: 4.8, carb: 4.8, fibra: 3.7 },
  "cebola, crua": { kcal: 39, prot: 1.7, lip: 0.1, carb: 8.9, fibra: 2.2 },
  "cebolinha, crua": { kcal: 20, prot: 1.9, lip: 0.4, carb: 3.4, fibra: 3.6 },
  "cenoura, cozida": { kcal: 30, prot: 0.8, lip: 0.2, carb: 6.7, fibra: 2.6 },
  "cenoura, crua": { kcal: 34, prot: 1.3, lip: 0.2, carb: 7.7, fibra: 3.2 },
  "chicória, crua": { kcal: 14, prot: 1.1, lip: 0.1, carb: 2.9, fibra: 2.2 },
  "chuchu, cozido": { kcal: 19, prot: 0.4, lip: 0, carb: 4.8, fibra: 1.0 },
  "chuchu, cru": { kcal: 17, prot: 0.7, lip: 0.1, carb: 4.1, fibra: 1.3 },
  "coentro, folhas desidratadas": { kcal: 309, prot: 20.9, lip: 10.4, carb: 48.0, fibra: 37.3 },
  "couve, manteiga, crua": { kcal: 27, prot: 2.9, lip: 0.5, carb: 4.3, fibra: 3.1 },
  "couve, manteiga, refogada": { kcal: 90, prot: 1.7, lip: 6.6, carb: 8.7, fibra: 5.7 },
  "couve-flor, crua": { kcal: 23, prot: 1.9, lip: 0.2, carb: 4.5, fibra: 2.4 },
  "couve-flor, cozida": { kcal: 19, prot: 1.2, lip: 0.3, carb: 3.9, fibra: 2.1 },
  "espinafre, nova zelândia, cru": { kcal: 16, prot: 2.0, lip: 0.2, carb: 2.6, fibra: 2.1 },
  "espinafre, nova zelândia, refogado": { kcal: 67, prot: 2.7, lip: 5.4, carb: 4.2, fibra: 2.5 },
  "farinha, de mandioca, crua": { kcal: 361, prot: 1.6, lip: 0.3, carb: 87.9, fibra: 6.4 },
  "farinha, de mandioca, torrada": { kcal: 365, prot: 1.2, lip: 0.3, carb: 89.2, fibra: 6.5 },
  "farinha, de puba": { kcal: 360, prot: 1.6, lip: 0.5, carb: 87.3, fibra: 4.2 },
  "fécula, de mandioca": { kcal: 331, prot: 0.5, lip: 0.3, carb: 81.1, fibra: 0.6 },
  "feijão, broto, cru": { kcal: 39, prot: 4.2, lip: 0.1, carb: 7.8, fibra: 2.0 },
  "inhame, cru": { kcal: 97, prot: 2.1, lip: 0.2, carb: 23.2, fibra: 1.7 },
  "jiló, cru": { kcal: 27, prot: 1.4, lip: 0.2, carb: 6.2, fibra: 4.8 },
  "jurubeba, crua": { kcal: 126, prot: 4.4, lip: 3.9, carb: 23.1, fibra: 23.9 },
  "mandioca, cozida": { kcal: 125, prot: 0.6, lip: 0.3, carb: 30.1, fibra: 1.6 },
  "mandioca, crua": { kcal: 151, prot: 1.1, lip: 0.3, carb: 36.2, fibra: 1.9 },
  "mandioca, farofa, temperada": { kcal: 406, prot: 2.1, lip: 9.1, carb: 80.3, fibra: 7.8 },
  "mandioca, frita": { kcal: 300, prot: 1.4, lip: 11.2, carb: 50.3, fibra: 1.9 },
  "manjericão, cru": { kcal: 21, prot: 2.0, lip: 0.4, carb: 3.6, fibra: 3.3 },
  "maxixe, cru": { kcal: 14, prot: 1.4, lip: 0.1, carb: 2.7, fibra: 2.2 },
  "mostarda, folha, crua": { kcal: 18, prot: 2.1, lip: 0.2, carb: 3.2, fibra: 1.9 },
  "nhoque, batata, cozido": { kcal: 181, prot: 5.9, lip: 1.9, carb: 36.8, fibra: 1.8 },
  "nabo, cru": { kcal: 18, prot: 1.2, lip: 0.1, carb: 4.1, fibra: 2.6 },
  "palmito, juçara, em conserva": { kcal: 23, prot: 1.8, lip: 0.4, carb: 4.3, fibra: 3.2 },
  "palmito, pupunha, em conserva": { kcal: 29, prot: 2.5, lip: 0.5, carb: 5.5, fibra: 2.6 },
  "pão, de queijo, assado": { kcal: 363, prot: 5.1, lip: 24.6, carb: 34.2, fibra: 0.6 },
  "pão, de queijo, cru": { kcal: 295, prot: 3.6, lip: 14.0, carb: 38.5, fibra: 1.0 },
  "pepino, cru": { kcal: 10, prot: 0.9, lip: 0, carb: 2.0, fibra: 1.1 },
  "pimentão, amarelo, cru": { kcal: 28, prot: 1.2, lip: 0.4, carb: 6.0, fibra: 1.9 },
  "pimentão, verde, cru": { kcal: 21, prot: 1.1, lip: 0.2, carb: 4.9, fibra: 2.6 },
  "pimentão, vermelho, cru": { kcal: 23, prot: 1.0, lip: 0.1, carb: 5.5, fibra: 1.6 },
  "polvilho, doce": { kcal: 351, prot: 0.4, lip: 0, carb: 86.8, fibra: 0.2 },
  "quiabo, cru": { kcal: 30, prot: 1.9, lip: 0.3, carb: 6.4, fibra: 4.6 },
  "rabanete, cru": { kcal: 14, prot: 1.4, lip: 0.1, carb: 2.7, fibra: 2.2 },
  "repolho, branco, cru": { kcal: 17, prot: 0.9, lip: 0.1, carb: 3.9, fibra: 1.9 },
  "repolho, roxo, cru": { kcal: 31, prot: 1.9, lip: 0.1, carb: 7.2, fibra: 2.0 },
  "repolho, roxo, refogado": { kcal: 42, prot: 1.8, lip: 1.2, carb: 7.6, fibra: 1.8 },
  "rúcula, crua": { kcal: 13, prot: 1.8, lip: 0.1, carb: 2.2, fibra: 1.7 },
  "salsa, crua": { kcal: 33, prot: 3.3, lip: 0.6, carb: 5.7, fibra: 1.9 },
  "seleta de legumes, enlatada": { kcal: 57, prot: 3.4, lip: 0.4, carb: 12.7, fibra: 3.1 },
  "serralha, crua": { kcal: 30, prot: 2.7, lip: 0.7, carb: 4.9, fibra: 3.5 },
  "taioba, crua": { kcal: 34, prot: 2.9, lip: 0.9, carb: 5.4, fibra: 4.5 },
  "tomate, com semente, cru": { kcal: 15, prot: 1.1, lip: 0.2, carb: 3.1, fibra: 1.2 },
  "tomate, extrato": { kcal: 61, prot: 2.4, lip: 0.2, carb: 15.0, fibra: 2.8 },
  "tomate, molho industrializado": { kcal: 38, prot: 1.4, lip: 0.9, carb: 7.7, fibra: 3.1 },
  "tomate, purê": { kcal: 28, prot: 1.4, lip: 0, carb: 6.9, fibra: 1.0 },
  "tomate, salada": { kcal: 21, prot: 0.8, lip: 0, carb: 5.1, fibra: 2.3 },
  "vagem, crua": { kcal: 25, prot: 1.8, lip: 0.2, carb: 5.3, fibra: 2.4 },
  "abacate, cru": { kcal: 96, prot: 1.2, lip: 8.4, carb: 6.0, fibra: 6.3 },
  "abacaxi, cru": { kcal: 48, prot: 0.9, lip: 0.1, carb: 12.3, fibra: 1.0 },
  "abacaxi, polpa, congelada": { kcal: 31, prot: 0.5, lip: 0.1, carb: 7.8, fibra: 0.3 },
  "abiu, cru": { kcal: 62, prot: 0.8, lip: 0.7, carb: 14.9, fibra: 1.7 },
  "açaí, polpa, com xarope": { kcal: 110, prot: 0.7, lip: 3.7, carb: 21.5, fibra: 1.7 },
  "açaí, polpa, congelada": { kcal: 58, prot: 0.8, lip: 3.9, carb: 6.2, fibra: 2.6 },
  "acerola, crua": { kcal: 33, prot: 0.9, lip: 0.2, carb: 8.0, fibra: 1.5 },
  "acerola, polpa, congelada": { kcal: 22, prot: 0.6, lip: 0, carb: 5.5, fibra: 0.7 },
  "ameixa, calda, enlatada": { kcal: 183, prot: 0.4, lip: 0, carb: 46.9, fibra: 0.5 },
  "ameixa, crua": { kcal: 53, prot: 0.8, lip: 0, carb: 13.9, fibra: 2.4 },
  "ameixa, em calda, drenada": { kcal: 177, prot: 1.0, lip: 0.3, carb: 47.7, fibra: 4.5 },
  "atemóia, crua": { kcal: 97, prot: 1.0, lip: 0.3, carb: 25.3, fibra: 2.1 },
  "banana, da terra, crua": { kcal: 128, prot: 1.4, lip: 0.2, carb: 33.7, fibra: 1.5 },
  "banana, doce em barra": { kcal: 280, prot: 2.2, lip: 0.1, carb: 75.7, fibra: 3.8 },
  "banana, figo, crua": { kcal: 105, prot: 1.1, lip: 0.1, carb: 27.8, fibra: 2.8 },
  "banana, maçã, crua": { kcal: 87, prot: 1.8, lip: 0.1, carb: 22.3, fibra: 2.6 },
  "banana, nanica, crua": { kcal: 92, prot: 1.4, lip: 0.1, carb: 23.8, fibra: 1.9 },
  "banana, ouro, crua": { kcal: 112, prot: 1.5, lip: 0.2, carb: 29.3, fibra: 2.0 },
  "banana, pacova, crua": { kcal: 78, prot: 1.2, lip: 0.1, carb: 20.3, fibra: 2.0 },
  "banana, prata, crua": { kcal: 98, prot: 1.3, lip: 0.1, carb: 26.0, fibra: 2.0 },
  "cacau, cru": { kcal: 74, prot: 1.0, lip: 0.1, carb: 19.4, fibra: 2.2 },
  "cajá-manga, cru": { kcal: 46, prot: 1.3, lip: 0, carb: 11.4, fibra: 2.6 },
  "cajá, polpa, congelada": { kcal: 26, prot: 0.6, lip: 0.2, carb: 6.4, fibra: 1.4 },
  "caju, cru": { kcal: 43, prot: 1.0, lip: 0.3, carb: 10.3, fibra: 1.7 },
  "caju, polpa, congelada": { kcal: 37, prot: 0.5, lip: 0.2, carb: 9.4, fibra: 0.8 },
  "caju, suco concentrado": { kcal: 45, prot: 0.4, lip: 0.2, carb: 10.7, fibra: 0.6 },
  "caqui, chocolate, cru": { kcal: 71, prot: 0.4, lip: 0.1, carb: 19.3, fibra: 6.5 },
  "carambola, crua": { kcal: 46, prot: 0.9, lip: 0.2, carb: 11.5, fibra: 2.0 },
  "ciriguela, crua": { kcal: 76, prot: 1.4, lip: 0.4, carb: 18.9, fibra: 3.9 },
  "cupuaçu, cru": { kcal: 49, prot: 1.2, lip: 1.0, carb: 10.4, fibra: 3.1 },
  "cupuaçu, polpa, congelada": { kcal: 49, prot: 0.8, lip: 0.6, carb: 11.4, fibra: 1.6 },
  "figo, cru": { kcal: 41, prot: 1.0, lip: 0.2, carb: 10.2, fibra: 1.8 },
  "figo, enlatado, em calda": { kcal: 184, prot: 0.6, lip: 0.2, carb: 50.3, fibra: 2.0 },
  "fruta-pão, crua": { kcal: 67, prot: 1.1, lip: 0.2, carb: 17.2, fibra: 5.5 },
  "goiaba, branca, crua": { kcal: 52, prot: 0.9, lip: 0.5, carb: 12.4, fibra: 6.3 },
  "goiaba, doce em pasta": { kcal: 269, prot: 0.6, lip: 0.0, carb: 74.1, fibra: 3.7 },
  "goiaba, doce, cascão": { kcal: 286, prot: 0.4, lip: 0.1, carb: 78.7, fibra: 4.4 },
  "goiaba, vermelha, crua": { kcal: 54, prot: 1.1, lip: 0.4, carb: 13.0, fibra: 6.2 },
  "graviola, crua": { kcal: 62, prot: 0.8, lip: 0.2, carb: 15.8, fibra: 1.9 },
  "graviola, polpa, congelada": { kcal: 38, prot: 0.6, lip: 0.1, carb: 9.8, fibra: 1.2 },
  "jabuticaba, crua": { kcal: 58, prot: 0.6, lip: 0.1, carb: 15.3, fibra: 2.3 },
  "jaca, crua": { kcal: 88, prot: 1.4, lip: 0.3, carb: 22.5, fibra: 2.4 },
  "jambo, cru": { kcal: 27, prot: 0.9, lip: 0.1, carb: 6.5, fibra: 5.1 },
  "jamelão, cru": { kcal: 41, prot: 0.5, lip: 0.1, carb: 10.6, fibra: 1.8 },
  "kiwi, cru": { kcal: 51, prot: 1.3, lip: 0.6, carb: 11.5, fibra: 2.7 },
  "laranja, baía, crua": { kcal: 45, prot: 1.0, lip: 0.1, carb: 11.5, fibra: 1.1 },
  "laranja, baía, suco": { kcal: 37, prot: 0.7, lip: 0, carb: 8.7, fibra: 0 },
  "laranja, da terra, crua": { kcal: 51, prot: 1.1, lip: 0.2, carb: 12.9, fibra: 4.0 },
  "laranja, da terra, suco": { kcal: 41, prot: 0.7, lip: 0.1, carb: 9.6, fibra: 1.0 },
  "laranja, lima, crua": { kcal: 46, prot: 1.1, lip: 0.1, carb: 11.5, fibra: 1.8 },
  "laranja, lima, suco": { kcal: 39, prot: 0.7, lip: 0.1, carb: 9.2, fibra: 0.4 },
  "laranja, pêra, crua": { kcal: 37, prot: 1.0, lip: 0.1, carb: 8.9, fibra: 0.8 },
  "laranja, pêra, suco": { kcal: 33, prot: 0.7, lip: 0.1, carb: 7.6, fibra: 0 },
  "laranja, valência, crua": { kcal: 46, prot: 0.8, lip: 0.2, carb: 11.7, fibra: 1.7 },
  "laranja, valência, suco": { kcal: 36, prot: 0.5, lip: 0.1, carb: 8.6, fibra: 0.4 },
  "limão, cravo, suco": { kcal: 14, prot: 0.3, lip: 0, carb: 5.2, fibra: 0 },
  "limão, galego, suco": { kcal: 22, prot: 0.6, lip: 0.1, carb: 7.3, fibra: 0 },
  "limão, tahiti, cru": { kcal: 32, prot: 0.9, lip: 0.1, carb: 11.1, fibra: 1.2 },
  "maçã, argentina, crua": { kcal: 63, prot: 0.2, lip: 0.2, carb: 16.6, fibra: 2.0 },
  "maçã, fuji, crua": { kcal: 56, prot: 0.3, lip: 0, carb: 15.2, fibra: 1.3 },
  "macaúba, crua": { kcal: 404, prot: 2.1, lip: 40.7, carb: 13.9, fibra: 13.4 },
  "mamão, doce em calda, drenado": { kcal: 196, prot: 0.2, lip: 0.1, carb: 54.0, fibra: 1.3 },
  "mamão, formosa, cru": { kcal: 45, prot: 0.8, lip: 0.1, carb: 11.6, fibra: 1.8 },
  "mamão, papaia, cru": { kcal: 40, prot: 0.5, lip: 0.1, carb: 10.4, fibra: 1.0 },
  "mamão verde, doce em calda": { kcal: 209, prot: 0.3, lip: 0.1, carb: 57.6, fibra: 1.2 },
  "manga, haden, crua": { kcal: 64, prot: 0.4, lip: 0.3, carb: 16.7, fibra: 1.6 },
  "manga, palmer, crua": { kcal: 72, prot: 0.4, lip: 0.2, carb: 19.4, fibra: 1.6 },
  "manga, polpa, congelada": { kcal: 48, prot: 0.4, lip: 0.2, carb: 12.5, fibra: 1.1 },
  "manga, tommy atkins, crua": { kcal: 51, prot: 0.9, lip: 0.2, carb: 12.8, fibra: 2.1 },
  "maracujá, cru": { kcal: 68, prot: 2.0, lip: 2.1, carb: 12.3, fibra: 1.1 },
  "maracujá, polpa, congelada": { kcal: 39, prot: 0.8, lip: 0.2, carb: 9.6, fibra: 0.5 },
  "maracujá, suco concentrado": { kcal: 42, prot: 0.8, lip: 0.2, carb: 9.6, fibra: 0.4 },
  "melancia, crua": { kcal: 33, prot: 0.9, lip: 0, carb: 8.1, fibra: 0.1 },
  "melão, cru": { kcal: 29, prot: 0.7, lip: 0, carb: 7.5, fibra: 0.3 },
  "mexerica, murcote, crua": { kcal: 58, prot: 0.9, lip: 0.1, carb: 14.9, fibra: 3.1 },
  "mexerica, rio, crua": { kcal: 37, prot: 0.7, lip: 0.1, carb: 9.3, fibra: 2.7 },
  "morango, cru": { kcal: 30, prot: 0.9, lip: 0.3, carb: 6.8, fibra: 1.7 },
  "nêspera, crua": { kcal: 43, prot: 0.3, lip: 0, carb: 11.5, fibra: 3.0 },
  "pequi, cru": { kcal: 205, prot: 2.3, lip: 18.0, carb: 13.0, fibra: 19.0 },
  "pêra, park, crua": { kcal: 61, prot: 0.2, lip: 0.2, carb: 16.1, fibra: 3.0 },
  "pêra, williams, crua": { kcal: 53, prot: 0.6, lip: 0.1, carb: 14.0, fibra: 3.0 },
  "pêssego, aurora, cru": { kcal: 36, prot: 0.8, lip: 0, carb: 9.3, fibra: 1.4 },
  "pêssego, enlatado, em calda": { kcal: 63, prot: 0.7, lip: 0, carb: 16.9, fibra: 1.0 },
  "pinha, crua": { kcal: 88, prot: 1.5, lip: 0.3, carb: 22.4, fibra: 3.4 },
  "pitanga, crua": { kcal: 41, prot: 0.9, lip: 0.2, carb: 10.2, fibra: 3.2 },
  "pitanga, polpa, congelada": { kcal: 19, prot: 0.3, lip: 0.1, carb: 4.8, fibra: 0.7 },
  "romã, crua": { kcal: 56, prot: 0.4, lip: 0, carb: 15.1, fibra: 0.4 },
  "tamarindo, cru": { kcal: 276, prot: 3.2, lip: 0.5, carb: 72.5, fibra: 6.4 },
  "tangerina, poncã, crua": { kcal: 38, prot: 0.8, lip: 0.1, carb: 9.6, fibra: 0.9 },
  "tangerina, poncã, suco": { kcal: 36, prot: 0.5, lip: 0, carb: 8.8, fibra: 0 },
  "tucumã, cru": { kcal: 262, prot: 2.1, lip: 19.1, carb: 26.5, fibra: 12.7 },
  "umbu, cru": { kcal: 37, prot: 0.8, lip: 0, carb: 9.4, fibra: 2.0 },
  "umbu, polpa, congelada": { kcal: 34, prot: 0.5, lip: 0.1, carb: 8.8, fibra: 1.3 },
  "uva, itália, crua": { kcal: 53, prot: 0.7, lip: 0.2, carb: 13.6, fibra: 0.9 },
  "uva, rubi, crua": { kcal: 49, prot: 0.6, lip: 0.2, carb: 12.7, fibra: 0.9 },
  "uva, suco concentrado": { kcal: 58, prot: 0, lip: 0, carb: 14.7, fibra: 0.2 },
  "azeite, de dendê": { kcal: 884, prot: 0, lip: 100.0, carb: 0, fibra: 0 },
  "azeite, de oliva, extra virgem": { kcal: 884, prot: 0, lip: 100.0, carb: 0, fibra: 0 },
  "manteiga, com sal": { kcal: 726, prot: 0.4, lip: 82.4, carb: 0.1, fibra: 0 },
  "manteiga, sem sal": { kcal: 758, prot: 0.4, lip: 86.0, carb: 0.0, fibra: 0 },
  "margarina, com sal 65%": { kcal: 596, prot: 0, lip: 67.4, carb: 0.0, fibra: 0 },
  "margarina, sem sal 80%": { kcal: 723, prot: 0, lip: 81.7, carb: 0.0, fibra: 0 },
  "margarina, interesterificado com sal": { kcal: 594, prot: 0, lip: 67.2, carb: 0.0, fibra: 0 },
  "margarina, interesterificado sem sal": { kcal: 593, prot: 0, lip: 67.1, carb: 0.0, fibra: 0 },
  "óleo, de babaçu": { kcal: 884, prot: 0, lip: 100.0, carb: 0, fibra: 0 },
  "óleo, de canola": { kcal: 884, prot: 0, lip: 100.0, carb: 0, fibra: 0 },
  "óleo, de girassol": { kcal: 884, prot: 0, lip: 100.0, carb: 0, fibra: 0 },
  "óleo, de milho": { kcal: 884, prot: 0, lip: 100.0, carb: 0, fibra: 0 },
  "óleo, de pequi": { kcal: 884, prot: 0, lip: 100.0, carb: 0, fibra: 0 },
  "óleo, de soja": { kcal: 884, prot: 0, lip: 100.0, carb: 0, fibra: 0 },
  "abadejo, filé, assado": { kcal: 112, prot: 23.5, lip: 1.2, carb: 0.0, fibra: 0 },
  "abadejo, filé, cozido": { kcal: 91, prot: 19.3, lip: 0.9, carb: 0.0, fibra: 0 },
  "abadejo, filé, cru": { kcal: 59, prot: 13.1, lip: 0.4, carb: 0.0, fibra: 0 },
  "abadejo, filé, grelhado": { kcal: 130, prot: 27.6, lip: 1.3, carb: 0.0, fibra: 0 },
  "atum, conserva em óleo": { kcal: 166, prot: 26.2, lip: 6.0, carb: 0.0, fibra: 0 },
  "atum, fresco, cru": { kcal: 118, prot: 25.7, lip: 0.9, carb: 0.0, fibra: 0 },
  "bacalhau, salgado, cru": { kcal: 136, prot: 29.0, lip: 1.3, carb: 0.0, fibra: 0 },
  "bacalhau, salgado, refogado": { kcal: 140, prot: 24.0, lip: 3.6, carb: 1.2, fibra: 0 },
  "cação, posta, frito": { kcal: 208, prot: 25.0, lip: 10.0, carb: 3.1, fibra: 0.5 },
  "cação, posta, cozida": { kcal: 116, prot: 25.6, lip: 0.7, carb: 0.0, fibra: 0 },
  "cação, posta, crua": { kcal: 83, prot: 17.9, lip: 0.8, carb: 0.0, fibra: 0 },
  "camarão, cozido": { kcal: 90, prot: 19.0, lip: 1.0, carb: 0.0, fibra: 0 },
  "camarão, cru": { kcal: 47, prot: 10.0, lip: 0.5, carb: 0.0, fibra: 0 },
  "camarão, frito": { kcal: 231, prot: 18.4, lip: 15.6, carb: 2.9, fibra: 0 },
  "caranguejo, cozido": { kcal: 83, prot: 18.5, lip: 0.4, carb: 0.0, fibra: 0 },
  "corimba, cru": { kcal: 128, prot: 17.4, lip: 6.0, carb: 0.0, fibra: 0 },
  "corimbatá, assado": { kcal: 261, prot: 19.9, lip: 19.6, carb: 0.0, fibra: 0 },
  "corimbatá, cozido": { kcal: 239, prot: 20.1, lip: 16.9, carb: 0.0, fibra: 0 },
  "corvina de água doce, crua": { kcal: 101, prot: 18.9, lip: 2.2, carb: 0.0, fibra: 0 },
  "corvina do mar, crua": { kcal: 94, prot: 18.6, lip: 1.6, carb: 0.0, fibra: 0 },
  "corvina, assada": { kcal: 147, prot: 26.8, lip: 3.6, carb: 0.0, fibra: 0 },
  "corvina, cozida": { kcal: 100, prot: 23.4, lip: 2.6, carb: 0.0, fibra: 0 },
  "dourada, fresca": { kcal: 131, prot: 18.8, lip: 5.6, carb: 0.0, fibra: 0 },
  "lambari, congelado, cru": { kcal: 131, prot: 16.8, lip: 6.5, carb: 0.0, fibra: 0 },
  "lambari, congelado, frito": { kcal: 327, prot: 28.4, lip: 22.8, carb: 0.0, fibra: 0 },
  "lambari, fresco, cru": { kcal: 152, prot: 15.7, lip: 9.4, carb: 0.0, fibra: 0 },
  "manjuba, com farinha, frita": { kcal: 344, prot: 23.5, lip: 22.6, carb: 10.2, fibra: 0.4 },
  "manjuba, frita": { kcal: 349, prot: 30.1, lip: 24.5, carb: 0.0, fibra: 0 },
  "merluza, filé, assado": { kcal: 122, prot: 26.6, lip: 0.9, carb: 0.0, fibra: 0 },
  "merluza, filé, cru": { kcal: 89, prot: 16.6, lip: 2.0, carb: 0.0, fibra: 0 },
  "merluza, filé, frito": { kcal: 192, prot: 26.9, lip: 8.5, carb: 0.0, fibra: 0 },
  "pescada, branca, crua": { kcal: 111, prot: 16.3, lip: 4.6, carb: 0.0, fibra: 0 },
  "pescada, branca, frita": { kcal: 223, prot: 27.4, lip: 11.8, carb: 0.0, fibra: 0 },
  "pescada, filé, frito": { kcal: 283, prot: 21.4, lip: 19.1, carb: 5.0, fibra: 0 },
  "pescada, filé, cru": { kcal: 107, prot: 16.7, lip: 4.0, carb: 0.0, fibra: 0 },
  "pescada, filé, frito2": { kcal: 154, prot: 28.6, lip: 3.6, carb: 0.0, fibra: 0 },
  "pescada, molho escabeche": { kcal: 142, prot: 11.8, lip: 8.0, carb: 5.0, fibra: 0.8 },
  "pescadinha, crua": { kcal: 76, prot: 15.5, lip: 1.1, carb: 0.0, fibra: 0 },
  "pintado, assado": { kcal: 192, prot: 36.5, lip: 4.0, carb: 0.0, fibra: 0 },
  "pintado, cru": { kcal: 91, prot: 18.6, lip: 1.3, carb: 0.0, fibra: 0 },
  "pintado, grelhado": { kcal: 152, prot: 30.8, lip: 2.3, carb: 0.0, fibra: 0 },
  "porquinho, cru": { kcal: 93, prot: 20.5, lip: 0.6, carb: 0.0, fibra: 0 },
  "salmão, grelhado": { kcal: 229, prot: 23.9, lip: 14.0, carb: 0.0, fibra: 0 },
  "salmão, cru": { kcal: 170, prot: 19.3, lip: 9.7, carb: 0.0, fibra: 0 },
  "salmão, grelhado sem pele": { kcal: 243, prot: 26.1, lip: 14.5, carb: 0.0, fibra: 0 },
  "sardinha, assada": { kcal: 164, prot: 32.2, lip: 3.0, carb: 0.0, fibra: 0 },
  "sardinha, conserva em óleo": { kcal: 285, prot: 15.9, lip: 24.0, carb: 0.0, fibra: 0 },
  "sardinha, frita": { kcal: 257, prot: 33.4, lip: 12.7, carb: 0.0, fibra: 0 },
  "sardinha, crua": { kcal: 114, prot: 21.1, lip: 2.7, carb: 0.0, fibra: 0 },
  "tucunaré, cru": { kcal: 88, prot: 18.0, lip: 1.2, carb: 0.0, fibra: 0 },
  "apresuntado": { kcal: 129, prot: 13.5, lip: 6.7, carb: 2.9, fibra: 0 },
  "caldo de carne, tablete": { kcal: 241, prot: 7.8, lip: 16.6, carb: 15.1, fibra: 0.6 },
  "caldo de galinha, tablete": { kcal: 251, prot: 6.3, lip: 20.4, carb: 10.6, fibra: 11.8 },
  "carne, bovina, acém, cozido": { kcal: 212, prot: 26.7, lip: 10.9, carb: 0.0, fibra: 0 },
  "carne, bovina, acém, cru": { kcal: 137, prot: 19.4, lip: 5.9, carb: 0.0, fibra: 0 },
  "carne, bovina, acém, sem gordura, cozido": { kcal: 215, prot: 27.3, lip: 10.9, carb: 0.0, fibra: 0 },
  "carne, bovina, acém, sem gordura, cru": { kcal: 144, prot: 20.8, lip: 6.1, carb: 0.0, fibra: 0 },
  "carne, bovina, almôndegas, cruas": { kcal: 189, prot: 12.3, lip: 11.2, carb: 9.8, fibra: 0 },
  "carne, bovina, almôndegas, fritas": { kcal: 272, prot: 18.2, lip: 15.8, carb: 14.3, fibra: 0 },
  "carne, bovina, bucho, cozido": { kcal: 133, prot: 21.6, lip: 4.5, carb: 0.0, fibra: 0 },
  "carne, bovina, bucho, cru": { kcal: 137, prot: 20.5, lip: 5.5, carb: 0.0, fibra: 0 },
  "carne, bovina, capa de contrafilé, crua": { kcal: 217, prot: 19.2, lip: 15.0, carb: 0.0, fibra: 0 },
  "carne, bovina, capa de contrafilé, grelhada": { kcal: 312, prot: 30.7, lip: 20.0, carb: 0.0, fibra: 0 },
  "carne, bovina, capa de contrafilé, sem gordura, crua": { kcal: 131, prot: 21.5, lip: 4.3, carb: 0.0, fibra: 0 },
  "carne, bovina, capa de contrafilé, sem gordura, grelhada": { kcal: 239, prot: 35.1, lip: 10.0, carb: 0.0, fibra: 0 },
  "carne, bovina, charque, cozido": { kcal: 263, prot: 36.4, lip: 11.9, carb: 0.0, fibra: 0 },
  "carne, bovina, charque, cru": { kcal: 249, prot: 22.7, lip: 16.8, carb: 0.0, fibra: 0 },
  "carne, bovina, contrafilé, à milanesa": { kcal: 352, prot: 20.6, lip: 24.0, carb: 12.2, fibra: 0.4 },
  "carne, bovina, contrafilé de costela, cru": { kcal: 202, prot: 19.8, lip: 13.1, carb: 0.0, fibra: 0 },
  "carne, bovina, contrafilé de costela, grelhado": { kcal: 275, prot: 29.9, lip: 16.3, carb: 0.0, fibra: 0 },
  "carne, bovina, contrafilé, com gordura, cru": { kcal: 206, prot: 21.2, lip: 12.8, carb: 0.0, fibra: 0 },
  "carne, bovina, contrafilé, com gordura, grelhado": { kcal: 278, prot: 32.4, lip: 15.5, carb: 0.0, fibra: 0 },
  "carne, bovina, contrafilé, sem gordura, cru": { kcal: 157, prot: 24.0, lip: 6.0, carb: 0.0, fibra: 0 },
  "carne, bovina, contrafilé, sem gordura, grelhado": { kcal: 194, prot: 35.9, lip: 4.5, carb: 0.0, fibra: 0 },
  "carne, bovina, costela, assada": { kcal: 373, prot: 28.8, lip: 27.7, carb: 0.0, fibra: 0 },
  "carne, bovina, costela, crua": { kcal: 358, prot: 16.7, lip: 31.8, carb: 0.0, fibra: 0 },
  "carne, bovina, coxão duro, cozido": { kcal: 217, prot: 31.9, lip: 8.9, carb: 0.0, fibra: 0 },
  "carne, bovina, coxão duro, cru": { kcal: 148, prot: 21.5, lip: 6.2, carb: 0.0, fibra: 0 },
  "carne, bovina, coxão mole, cozido": { kcal: 219, prot: 32.4, lip: 8.9, carb: 0.0, fibra: 0 },
  "carne, bovina, coxão mole, cru": { kcal: 169, prot: 21.2, lip: 8.7, carb: 0.0, fibra: 0 },
  "carne, bovina, cupim, assado": { kcal: 330, prot: 28.6, lip: 23.0, carb: 0.0, fibra: 0 },
  "carne, bovina, cupim, cru": { kcal: 221, prot: 19.5, lip: 15.3, carb: 0.0, fibra: 0 },
  "carne, bovina, fígado, cru": { kcal: 141, prot: 20.7, lip: 5.4, carb: 1.1, fibra: 0 },
  "carne, bovina, fígado, grelhado": { kcal: 225, prot: 29.9, lip: 9.0, carb: 4.2, fibra: 0 },
  "carne, bovina, filé mignon, cru": { kcal: 143, prot: 21.6, lip: 5.6, carb: 0.0, fibra: 0 },
  "carne, bovina, filé mignon, grelhado": { kcal: 220, prot: 32.8, lip: 8.8, carb: 0.0, fibra: 0 },
  "carne, bovina, flanco, cozido": { kcal: 196, prot: 29.4, lip: 7.8, carb: 0.0, fibra: 0 },
  "carne, bovina, flanco, cru": { kcal: 141, prot: 20.0, lip: 6.2, carb: 0.0, fibra: 0 },
  "carne, bovina, fraldinha, cozida": { kcal: 338, prot: 24.2, lip: 26.0, carb: 0.0, fibra: 0 },
  "carne, bovina, fraldinha, crua": { kcal: 221, prot: 17.6, lip: 16.1, carb: 0.0, fibra: 0 },
  "carne, bovina, lagarto, cozido": { kcal: 222, prot: 32.9, lip: 9.1, carb: 0.0, fibra: 0 },
  "carne, bovina, lagarto, cru": { kcal: 135, prot: 20.5, lip: 5.2, carb: 0.0, fibra: 0 },
  "carne, bovina, língua, cozida": { kcal: 315, prot: 21.4, lip: 24.8, carb: 0.0, fibra: 0 },
  "carne, bovina, língua, crua": { kcal: 215, prot: 17.1, lip: 15.8, carb: 0.0, fibra: 0 },
  "carne, bovina, maminha, crua": { kcal: 153, prot: 20.9, lip: 7.0, carb: 0.0, fibra: 0 },
  "carne, bovina, maminha, grelhada": { kcal: 153, prot: 30.7, lip: 2.4, carb: 0.0, fibra: 0 },
  "carne, bovina, miolo de alcatra, cru": { kcal: 163, prot: 21.6, lip: 7.8, carb: 0.0, fibra: 0 },
  "carne, bovina, miolo de alcatra, grelhado": { kcal: 241, prot: 31.9, lip: 11.6, carb: 0.0, fibra: 0 },
  "carne, bovina, músculo, cozido": { kcal: 194, prot: 31.2, lip: 6.7, carb: 0.0, fibra: 0 },
  "carne, bovina, músculo, cru": { kcal: 142, prot: 21.6, lip: 5.5, carb: 0.0, fibra: 0 },
  "carne, bovina, paleta, crua": { kcal: 159, prot: 21.4, lip: 7.5, carb: 0.0, fibra: 0 },
  "carne, bovina, paleta, cozida": { kcal: 194, prot: 29.7, lip: 7.4, carb: 0.0, fibra: 0 },
  "carne, bovina, paleta, sem gordura, crua": { kcal: 141, prot: 21.0, lip: 5.7, carb: 0.0, fibra: 0 },
  "carne, bovina, patinho, cru": { kcal: 133, prot: 21.7, lip: 4.5, carb: 0.0, fibra: 0 },
  "carne, bovina, patinho, grelhado": { kcal: 219, prot: 35.9, lip: 7.3, carb: 0.0, fibra: 0 },
  "carne, bovina, peito, cozido": { kcal: 338, prot: 22.2, lip: 27.0, carb: 0.0, fibra: 0 },
  "carne, bovina, peito, cru": { kcal: 259, prot: 17.6, lip: 20.4, carb: 0.0, fibra: 0 },
  "carne, bovina, picanha, crua": { kcal: 213, prot: 18.8, lip: 14.7, carb: 0.0, fibra: 0 },
  "carne, bovina, picanha, grelhada": { kcal: 289, prot: 26.4, lip: 19.5, carb: 0.0, fibra: 0 },
  "carne, bovina, picanha, sem gordura, crua": { kcal: 134, prot: 21.3, lip: 4.7, carb: 0.0, fibra: 0 },
  "carne, bovina, picanha, sem gordura, grelhada": { kcal: 238, prot: 31.9, lip: 11.3, carb: 0.0, fibra: 0 },
  "carne, bovina, seca, cozida": { kcal: 313, prot: 26.9, lip: 21.9, carb: 0.0, fibra: 0 },
  "carne, bovina, seca, crua": { kcal: 313, prot: 19.7, lip: 25.4, carb: 0.0, fibra: 0 },
  "coxinha de frango, frita": { kcal: 283, prot: 9.6, lip: 11.8, carb: 34.5, fibra: 5.0 },
  "croquete, de carne, cru": { kcal: 246, prot: 12.0, lip: 15.6, carb: 13.9, fibra: 0 },
  "croquete, de carne, frito": { kcal: 347, prot: 16.9, lip: 22.7, carb: 18.1, fibra: 0 },
  "empada de frango, assada": { kcal: 358, prot: 6.9, lip: 15.6, carb: 47.5, fibra: 2.2 },
  "empada, de frango, pré-cozida": { kcal: 377, prot: 7.3, lip: 22.9, carb: 35.5, fibra: 2.2 },
  "frango, asa, crua": { kcal: 213, prot: 18.1, lip: 15.1, carb: 0.0, fibra: 0 },
  "frango, caipira, com pele, cozido": { kcal: 243, prot: 23.9, lip: 15.6, carb: 0.0, fibra: 0 },
  "frango, caipira, sem pele, cozido": { kcal: 196, prot: 29.6, lip: 7.7, carb: 0.0, fibra: 0 },
  "frango, coração, cru": { kcal: 222, prot: 12.6, lip: 18.6, carb: 0.0, fibra: 0 },
  "frango, coração, grelhado": { kcal: 207, prot: 22.4, lip: 12.1, carb: 0.6, fibra: 0 },
  "frango, coxa, com pele, assada": { kcal: 215, prot: 28.5, lip: 10.4, carb: 0.1, fibra: 0 },
  "frango, coxa, com pele, crua": { kcal: 161, prot: 17.1, lip: 9.8, carb: 0.0, fibra: 0 },
  "frango, coxa, sem pele, cozida": { kcal: 167, prot: 26.9, lip: 5.8, carb: 0.0, fibra: 0 },
  "frango, coxa, sem pele, crua": { kcal: 120, prot: 17.8, lip: 4.9, carb: 0.0, fibra: 0 },
  "frango, fígado, cru": { kcal: 106, prot: 17.6, lip: 3.5, carb: 0.0, fibra: 0 },
  "frango, filé, à milanesa": { kcal: 221, prot: 28.5, lip: 7.8, carb: 7.5, fibra: 1.1 },
  "frango, inteiro, com pele, cru": { kcal: 226, prot: 16.4, lip: 17.3, carb: 0.0, fibra: 0 },
  "frango, inteiro, sem pele, assado": { kcal: 187, prot: 28.0, lip: 7.5, carb: 0.0, fibra: 0 },
  "frango, inteiro, sem pele, cozido": { kcal: 170, prot: 25.0, lip: 7.1, carb: 0.0, fibra: 0 },
  "frango, inteiro, sem pele, cru": { kcal: 129, prot: 20.6, lip: 4.6, carb: 0.0, fibra: 0 },
  "frango, peito, com pele, assado": { kcal: 212, prot: 33.4, lip: 7.6, carb: 0.0, fibra: 0 },
  "frango, peito, com pele, cru": { kcal: 149, prot: 20.8, lip: 6.7, carb: 0.0, fibra: 0 },
  "frango, peito, sem pele, cozido": { kcal: 163, prot: 31.5, lip: 3.2, carb: 0.0, fibra: 0 },
  "frango, peito, sem pele, cru": { kcal: 119, prot: 21.5, lip: 3.0, carb: 0.0, fibra: 0 },
  "frango, peito, sem pele, grelhado": { kcal: 159, prot: 32.0, lip: 2.5, carb: 0.0, fibra: 0 },
  "frango, sobrecoxa, com pele, assada": { kcal: 260, prot: 28.7, lip: 15.2, carb: 0.0, fibra: 0 },
  "frango, sobrecoxa, com pele, crua": { kcal: 255, prot: 15.5, lip: 20.9, carb: 0.0, fibra: 0 },
  "frango, sobrecoxa, sem pele, assada": { kcal: 233, prot: 29.2, lip: 12.0, carb: 0.0, fibra: 0 },
  "frango, sobrecoxa, sem pele, crua": { kcal: 162, prot: 17.6, lip: 9.6, carb: 0.0, fibra: 0 },
  "hambúrguer, bovino, cru": { kcal: 215, prot: 13.2, lip: 16.2, carb: 4.2, fibra: 0 },
  "hambúrguer, bovino, frito": { kcal: 258, prot: 20.0, lip: 17.0, carb: 6.3, fibra: 0 },
  "hambúrguer, bovino, grelhado": { kcal: 210, prot: 13.2, lip: 12.4, carb: 11.3, fibra: 0 },
  "linguiça, frango, crua": { kcal: 218, prot: 14.2, lip: 17.4, carb: 0.0, fibra: 0 },
  "linguiça, frango, frita": { kcal: 245, prot: 18.3, lip: 18.5, carb: 0.0, fibra: 0 },
  "linguiça, frango, grelhada": { kcal: 244, prot: 18.2, lip: 18.4, carb: 0.0, fibra: 0 },
  "linguiça, porco, crua": { kcal: 227, prot: 16.1, lip: 17.6, carb: 0.0, fibra: 0 },
  "linguiça, porco, frita": { kcal: 280, prot: 20.5, lip: 21.3, carb: 0.0, fibra: 0 },
  "linguiça, porco, grelhada": { kcal: 296, prot: 23.2, lip: 21.9, carb: 0.0, fibra: 0 },
  "mortadela": { kcal: 269, prot: 12.0, lip: 21.6, carb: 5.8, fibra: 0 },
  "peru, congelado, assado": { kcal: 163, prot: 26.2, lip: 5.7, carb: 0.0, fibra: 0 },
  "peru, congelado, cru": { kcal: 94, prot: 18.1, lip: 1.8, carb: 0.0, fibra: 0 },
  "porco, bisteca, crua": { kcal: 164, prot: 21.5, lip: 8.0, carb: 0.0, fibra: 0 },
  "porco, bisteca, frita": { kcal: 311, prot: 33.7, lip: 18.5, carb: 0.0, fibra: 0 },
  "porco, bisteca, grelhada": { kcal: 280, prot: 28.9, lip: 17.4, carb: 0.0, fibra: 0 },
  "porco, costela, assada": { kcal: 402, prot: 30.2, lip: 30.3, carb: 0.0, fibra: 0 },
  "porco, costela, crua": { kcal: 256, prot: 18.0, lip: 19.8, carb: 0.0, fibra: 0 },
  "porco, lombo, assado": { kcal: 210, prot: 35.7, lip: 6.4, carb: 0.0, fibra: 0 },
  "porco, lombo, cru": { kcal: 176, prot: 22.6, lip: 8.8, carb: 0.0, fibra: 0 },
  "porco, orelha, salgada, crua": { kcal: 258, prot: 18.5, lip: 19.9, carb: 0.0, fibra: 0 },
  "porco, pernil, assado": { kcal: 262, prot: 32.1, lip: 13.9, carb: 0.0, fibra: 0 },
  "porco, pernil, cru": { kcal: 186, prot: 20.1, lip: 11.1, carb: 0.0, fibra: 0 },
  "porco, rabo, salgado, cru": { kcal: 377, prot: 15.6, lip: 34.5, carb: 0.0, fibra: 0 },
  "presunto, com capa de gordura": { kcal: 128, prot: 14.4, lip: 6.8, carb: 1.4, fibra: 0 },
  "presunto, sem capa de gordura": { kcal: 94, prot: 14.3, lip: 2.7, carb: 2.1, fibra: 0 },
  "quibe, assado": { kcal: 136, prot: 14.6, lip: 2.7, carb: 12.9, fibra: 1.9 },
  "quibe, cru": { kcal: 109, prot: 12.4, lip: 1.7, carb: 10.8, fibra: 1.6 },
  "quibe, frito": { kcal: 254, prot: 14.9, lip: 15.8, carb: 12.3, fibra: 0 },
  "salame": { kcal: 398, prot: 25.8, lip: 30.6, carb: 2.9, fibra: 0 },
  "toucinho, cru": { kcal: 593, prot: 11.5, lip: 60.3, carb: 0.0, fibra: 0 },
  "toucinho, frito": { kcal: 697, prot: 27.3, lip: 64.3, carb: 0.0, fibra: 0 },
  "bebida láctea, pêssego": { kcal: 55, prot: 2.1, lip: 1.9, carb: 7.6, fibra: 0.3 },
  "creme de leite": { kcal: 221, prot: 1.5, lip: 22.5, carb: 4.5, fibra: 0 },
  "iogurte, natural": { kcal: 51, prot: 4.1, lip: 3.0, carb: 1.9, fibra: 0 },
  "iogurte, natural, desnatado": { kcal: 41, prot: 3.8, lip: 0.3, carb: 5.8, fibra: 0 },
  "iogurte, sabor morango": { kcal: 70, prot: 2.7, lip: 2.3, carb: 9.7, fibra: 0.2 },
  "iogurte, sabor pêssego": { kcal: 68, prot: 2.5, lip: 2.3, carb: 9.4, fibra: 0.7 },
  "leite, condensado": { kcal: 313, prot: 7.7, lip: 6.7, carb: 57.0, fibra: 0 },
  "leite, de cabra": { kcal: 66, prot: 3.1, lip: 3.8, carb: 5.2, fibra: 0 },
  "leite, achocolatado": { kcal: 83, prot: 2.1, lip: 2.2, carb: 14.2, fibra: 0.6 },
  "leite, desnatado, pó": { kcal: 362, prot: 34.7, lip: 0.9, carb: 53.0, fibra: 0 },
  "leite, integral, pó": { kcal: 497, prot: 25.4, lip: 26.9, carb: 39.2, fibra: 0 },
  "leite, fermentado": { kcal: 70, prot: 1.9, lip: 0.1, carb: 15.7, fibra: 0 },
  "queijo, minas, frescal": { kcal: 264, prot: 17.4, lip: 20.2, carb: 3.2, fibra: 0 },
  "queijo, minas, meia cura": { kcal: 321, prot: 21.2, lip: 24.6, carb: 3.6, fibra: 0 },
  "queijo, mozarela": { kcal: 330, prot: 22.6, lip: 25.2, carb: 3.0, fibra: 0 },
  "queijo, parmesão": { kcal: 453, prot: 35.6, lip: 33.5, carb: 1.7, fibra: 0 },
  "queijo, pasteurizado": { kcal: 303, prot: 9.4, lip: 27.4, carb: 5.7, fibra: 0 },
  "queijo, petit suisse": { kcal: 121, prot: 5.8, lip: 2.8, carb: 18.5, fibra: 0 },
  "queijo, prato": { kcal: 360, prot: 22.7, lip: 29.1, carb: 1.9, fibra: 0 },
  "queijo, requeijão, cremoso": { kcal: 257, prot: 9.6, lip: 23.4, carb: 2.4, fibra: 0 },
  "queijo, ricota": { kcal: 140, prot: 12.6, lip: 8.1, carb: 3.8, fibra: 0 },
  "bebida isotônica": { kcal: 26, prot: 0.0, lip: 0.0, carb: 6.4, fibra: 0 },
  "café, infusão 10%": { kcal: 9, prot: 0.7, lip: 0.1, carb: 1.5, fibra: 0 },
  "cana, aguardente": { kcal: 216, prot: 0, lip: 0, carb: 0, fibra: 0 },
  "cana, caldo": { kcal: 65, prot: 0, lip: 0, carb: 18.2, fibra: 0.1 },
  "cerveja, pilsen": { kcal: 41, prot: 0.6, lip: 0, carb: 3.3, fibra: 0 },
  "chá, erva-doce": { kcal: 1, prot: 0.0, lip: 0.0, carb: 0.4, fibra: 0 },
  "chá, mate": { kcal: 3, prot: 0.0, lip: 0.1, carb: 0.6, fibra: 0 },
  "chá, preto": { kcal: 2, prot: 0.0, lip: 0.0, carb: 0.6, fibra: 0 },
  "coco, água": { kcal: 22, prot: 0.0, lip: 0.0, carb: 5.3, fibra: 0.1 },
  "refrigerante, água tônica": { kcal: 31, prot: 0.0, lip: 0.0, carb: 8.0, fibra: 0 },
  "refrigerante, cola": { kcal: 34, prot: 0.0, lip: 0.0, carb: 8.7, fibra: 0 },
  "refrigerante, guaraná": { kcal: 39, prot: 0.0, lip: 0.0, carb: 10.0, fibra: 0 },
  "refrigerante, laranja": { kcal: 46, prot: 0.0, lip: 0.0, carb: 11.8, fibra: 0 },
  "refrigerante, limão": { kcal: 40, prot: 0.0, lip: 0.0, carb: 10.3, fibra: 0 },
  "omelete, de queijo": { kcal: 268, prot: 15.6, lip: 22.0, carb: 0.4, fibra: 0 },
  "ovo, de codorna, cru": { kcal: 177, prot: 13.7, lip: 12.7, carb: 0.8, fibra: 0 },
  "ovo, de galinha, clara, cozida": { kcal: 59, prot: 13.4, lip: 0.1, carb: 0.0, fibra: 0 },
  "ovo, de galinha, gema, cozida": { kcal: 353, prot: 15.9, lip: 30.8, carb: 1.6, fibra: 0 },
  "ovo, de galinha, inteiro, cozido": { kcal: 146, prot: 13.3, lip: 9.5, carb: 0.6, fibra: 0 },
  "ovo, de galinha, inteiro, cru": { kcal: 143, prot: 13.0, lip: 8.9, carb: 1.6, fibra: 0 },
  "ovo, de galinha, inteiro, frito": { kcal: 240, prot: 15.6, lip: 18.6, carb: 1.2, fibra: 0 },
  "achocolatado, pó": { kcal: 401, prot: 4.2, lip: 2.2, carb: 91.2, fibra: 3.9 },
  "açúcar, cristal": { kcal: 387, prot: 0.3, lip: 0, carb: 99.6, fibra: 0 },
  "açúcar, mascavo": { kcal: 369, prot: 0.8, lip: 0.1, carb: 94.5, fibra: 0 },
  "açúcar, refinado": { kcal: 387, prot: 0.3, lip: 0, carb: 99.5, fibra: 0 },
  "chocolate, ao leite": { kcal: 540, prot: 7.2, lip: 30.3, carb: 59.6, fibra: 2.2 },
  "chocolate, ao leite, com castanha": { kcal: 559, prot: 7.4, lip: 34.2, carb: 55.4, fibra: 2.5 },
  "chocolate, ao leite, dietético": { kcal: 557, prot: 6.9, lip: 33.8, carb: 56.3, fibra: 2.8 },
  "chocolate, meio amargo": { kcal: 475, prot: 4.9, lip: 29.9, carb: 62.4, fibra: 4.9 },
  "cocada branca": { kcal: 449, prot: 1.1, lip: 13.6, carb: 81.4, fibra: 3.6 },
  "doce, de abóbora, cremoso": { kcal: 199, prot: 0.9, lip: 0.2, carb: 54.6, fibra: 2.3 },
  "doce, de leite, cremoso": { kcal: 306, prot: 5.5, lip: 6.0, carb: 59.5, fibra: 0 },
  "geléia, mocotó, natural": { kcal: 106, prot: 2.1, lip: 0.1, carb: 24.2, fibra: 0 },
  "glicose de milho": { kcal: 292, prot: 0.0, lip: 0.0, carb: 79.4, fibra: 0 },
  "maria mole": { kcal: 301, prot: 3.8, lip: 0.2, carb: 73.6, fibra: 0.7 },
  "maria mole, coco queimado": { kcal: 307, prot: 3.9, lip: 0.1, carb: 75.1, fibra: 0.6 },
  "marmelada": { kcal: 257, prot: 0.4, lip: 0.1, carb: 70.8, fibra: 4.1 },
  "mel, de abelha": { kcal: 309, prot: 0.0, lip: 0.0, carb: 84.0, fibra: 0 },
  "melado": { kcal: 297, prot: 0.0, lip: 0.0, carb: 76.6, fibra: 0 },
  "quindim": { kcal: 411, prot: 4.7, lip: 24.4, carb: 46.3, fibra: 3.2 },
  "rapadura": { kcal: 352, prot: 1.0, lip: 0.1, carb: 90.8, fibra: 0 },
  "café, pó, torrado": { kcal: 419, prot: 14.7, lip: 11.9, carb: 65.8, fibra: 51.2 },
  "capuccino, pó": { kcal: 417, prot: 11.3, lip: 8.6, carb: 73.6, fibra: 2.4 },
  "fermento em pó": { kcal: 90, prot: 0.5, lip: 0.1, carb: 43.9, fibra: 0 },
  "fermento, biológico": { kcal: 90, prot: 17.0, lip: 1.5, carb: 7.7, fibra: 4.2 },
  "gelatina, pó": { kcal: 380, prot: 8.9, lip: 0, carb: 89.2, fibra: 0 },
  "shoyu": { kcal: 61, prot: 3.3, lip: 0.3, carb: 11.6, fibra: 0 },
  "tempero a base de sal": { kcal: 21, prot: 2.7, lip: 0.3, carb: 2.1, fibra: 0.6 },
  "azeitona, preta, conserva": { kcal: 194, prot: 1.2, lip: 20.3, carb: 5.5, fibra: 4.6 },
  "azeitona, verde, conserva": { kcal: 137, prot: 0.9, lip: 14.2, carb: 4.1, fibra: 3.8 },
  "chantilly, spray": { kcal: 315, prot: 0.5, lip: 27.3, carb: 16.9, fibra: 0 },
  "leite, de coco": { kcal: 166, prot: 1.0, lip: 18.4, carb: 2.2, fibra: 0.7 },
  "maionese, tradicional": { kcal: 302, prot: 0.6, lip: 30.5, carb: 7.9, fibra: 0 },
  "acarajé": { kcal: 289, prot: 8.3, lip: 19.9, carb: 19.1, fibra: 9.4 },
  "arroz carreteiro": { kcal: 154, prot: 10.8, lip: 7.1, carb: 11.6, fibra: 1.5 },
  "baião de dois": { kcal: 136, prot: 6.2, lip: 3.2, carb: 20.4, fibra: 5.1 },
  "barreado": { kcal: 165, prot: 18.3, lip: 9.5, carb: 0.2, fibra: 0.1 },
  "bife à cavalo": { kcal: 291, prot: 23.7, lip: 21.1, carb: 0.0, fibra: 0 },
  "bolinho de arroz": { kcal: 274, prot: 8.0, lip: 8.3, carb: 41.7, fibra: 2.7 },
  "camarão à baiana": { kcal: 101, prot: 7.9, lip: 6.0, carb: 3.2, fibra: 0.4 },
  "charuto, de repolho": { kcal: 78, prot: 6.8, lip: 1.1, carb: 10.1, fibra: 1.5 },
  "cuscuz, de milho, cozido com sal": { kcal: 113, prot: 2.2, lip: 0.7, carb: 25.3, fibra: 2.1 },
  "cuscuz, paulista": { kcal: 142, prot: 2.6, lip: 4.6, carb: 22.5, fibra: 2.4 },
  "cuxá, molho": { kcal: 80, prot: 5.6, lip: 3.6, carb: 5.7, fibra: 3.0 },
  "dobradinha": { kcal: 125, prot: 19.8, lip: 4.4, carb: 0.0, fibra: 0 },
  "estrogonofe de carne": { kcal: 173, prot: 15.0, lip: 10.8, carb: 3.0, fibra: 0 },
  "estrogonofe de frango": { kcal: 157, prot: 17.6, lip: 8.0, carb: 2.6, fibra: 0 },
  "feijão tropeiro mineiro": { kcal: 152, prot: 10.2, lip: 6.8, carb: 19.6, fibra: 3.6 },
  "feijoada": { kcal: 117, prot: 8.7, lip: 6.5, carb: 11.6, fibra: 5.1 },
  "frango, com açafrão": { kcal: 113, prot: 9.7, lip: 6.2, carb: 4.1, fibra: 0.2 },
  "macarrão, molho bolognesa": { kcal: 120, prot: 4.9, lip: 0.9, carb: 22.5, fibra: 0.8 },
  "maniçoba": { kcal: 134, prot: 10.0, lip: 8.7, carb: 3.4, fibra: 2.2 },
  "quibebe": { kcal: 86, prot: 8.6, lip: 2.7, carb: 6.6, fibra: 1.7 },
  "salada, de legumes, com maionese": { kcal: 96, prot: 1.1, lip: 7.0, carb: 8.9, fibra: 2.2 },
  "salada, de legumes, cozida": { kcal: 35, prot: 2.0, lip: 0.3, carb: 7.1, fibra: 2.5 },
  "salpicão, de frango": { kcal: 148, prot: 13.9, lip: 7.8, carb: 4.6, fibra: 0.4 },
  "sarapatel": { kcal: 123, prot: 18.5, lip: 4.4, carb: 1.1, fibra: 0 },
  "tabule": { kcal: 57, prot: 2.0, lip: 1.2, carb: 10.6, fibra: 2.1 },
  "tacacá": { kcal: 47, prot: 7.0, lip: 0.4, carb: 3.4, fibra: 0.2 },
  "tapioca, com manteiga": { kcal: 348, prot: 0.1, lip: 10.9, carb: 63.6, fibra: 0 },
  "tucupi, com pimenta": { kcal: 27, prot: 2.1, lip: 0.3, carb: 4.7, fibra: 0.2 },
  "vaca atolada": { kcal: 145, prot: 5.1, lip: 9.3, carb: 10.1, fibra: 2.3 },
  "vatapá": { kcal: 255, prot: 6.0, lip: 23.2, carb: 9.7, fibra: 1.7 },
  "virado à paulista": { kcal: 307, prot: 10.2, lip: 25.6, carb: 14.1, fibra: 2.2 },
  "yakisoba": { kcal: 113, prot: 7.5, lip: 2.6, carb: 18.3, fibra: 1.1 },
  "amendoim, grão, cru": { kcal: 544, prot: 27.2, lip: 43.9, carb: 20.3, fibra: 8.0 },
  "amendoim, torrado, salgado": { kcal: 606, prot: 22.5, lip: 54.0, carb: 18.7, fibra: 7.8 },
  "ervilha, em vagem": { kcal: 88, prot: 7.5, lip: 0.5, carb: 14.2, fibra: 9.7 },
  "ervilha, enlatada, drenada": { kcal: 74, prot: 4.6, lip: 0.4, carb: 13.4, fibra: 5.1 },
  "feijão, carioca, cozido": { kcal: 76, prot: 4.8, lip: 0.5, carb: 13.6, fibra: 8.5 },
  "feijão, carioca, cru": { kcal: 329, prot: 20.0, lip: 1.3, carb: 61.2, fibra: 18.4 },
  "feijão, fradinho, cozido": { kcal: 78, prot: 5.1, lip: 0.6, carb: 13.5, fibra: 7.5 },
  "feijão, fradinho, cru": { kcal: 339, prot: 20.2, lip: 2.4, carb: 61.2, fibra: 23.6 },
  "feijão, jalo, cozido": { kcal: 93, prot: 6.1, lip: 0.5, carb: 16.5, fibra: 13.9 },
  "feijão, jalo, cru": { kcal: 328, prot: 20.1, lip: 0.9, carb: 61.5, fibra: 30.3 },
  "feijão, preto, cozido": { kcal: 77, prot: 4.5, lip: 0.5, carb: 14.0, fibra: 8.4 },
  "feijão, preto, cru": { kcal: 324, prot: 21.3, lip: 1.2, carb: 58.8, fibra: 21.8 },
  "feijão, rajado, cozido": { kcal: 85, prot: 5.5, lip: 0.4, carb: 15.3, fibra: 9.3 },
  "feijão, rajado, cru": { kcal: 326, prot: 17.3, lip: 1.2, carb: 62.9, fibra: 24.0 },
  "feijão, rosinha, cozido": { kcal: 68, prot: 4.5, lip: 0.5, carb: 11.8, fibra: 4.8 },
  "feijão, rosinha, cru": { kcal: 337, prot: 20.9, lip: 1.3, carb: 62.2, fibra: 20.6 },
  "feijão, roxo, cozido": { kcal: 77, prot: 5.7, lip: 0.5, carb: 12.9, fibra: 11.5 },
  "feijão, roxo, cru": { kcal: 331, prot: 22.2, lip: 1.2, carb: 60.0, fibra: 33.8 },
  "grão-de-bico, cru": { kcal: 355, prot: 21.2, lip: 5.4, carb: 57.9, fibra: 12.4 },
  "guandu, cru": { kcal: 344, prot: 19.0, lip: 2.1, carb: 64.0, fibra: 21.3 },
  "lentilha, cozida": { kcal: 93, prot: 6.3, lip: 0.5, carb: 16.3, fibra: 7.9 },
  "lentilha, crua": { kcal: 339, prot: 23.2, lip: 0.8, carb: 62.0, fibra: 16.9 },
  "paçoca, amendoim": { kcal: 487, prot: 16.0, lip: 26.1, carb: 52.4, fibra: 7.3 },
  "pé-de-moleque, amendoim": { kcal: 503, prot: 13.2, lip: 28.0, carb: 54.7, fibra: 3.4 },
  "soja, farinha": { kcal: 404, prot: 36.0, lip: 14.6, carb: 38.4, fibra: 20.2 },
  "soja, extrato solúvel, fluido": { kcal: 39, prot: 2.4, lip: 1.6, carb: 4.3, fibra: 0.4 },
  "soja, extrato solúvel, pó": { kcal: 459, prot: 35.7, lip: 26.2, carb: 28.5, fibra: 7.3 },
  "soja, queijo tofu": { kcal: 64, prot: 6.6, lip: 4.0, carb: 2.1, fibra: 0.8 },
  "tremoço, cru": { kcal: 381, prot: 33.6, lip: 10.3, carb: 43.8, fibra: 32.3 },
  "tremoço, em conserva": { kcal: 121, prot: 11.1, lip: 3.8, carb: 12.4, fibra: 14.4 },
  "amêndoa, torrada, salgada": { kcal: 581, prot: 18.6, lip: 47.3, carb: 29.5, fibra: 11.6 },
  "castanha-de-caju, torrada, salgada": { kcal: 570, prot: 18.5, lip: 46.3, carb: 29.1, fibra: 3.7 },
  "castanha-do-brasil, crua": { kcal: 643, prot: 14.5, lip: 63.5, carb: 15.1, fibra: 7.9 },
  "coco, cru": { kcal: 406, prot: 3.7, lip: 42.0, carb: 10.4, fibra: 5.4 },
  "farinha, de mesocarpo de babaçu": { kcal: 329, prot: 1.4, lip: 0.2, carb: 79.2, fibra: 17.9 },
  "gergelim, semente": { kcal: 584, prot: 21.2, lip: 50.4, carb: 21.6, fibra: 11.9 },
  "linhaça, semente": { kcal: 495, prot: 14.1, lip: 32.3, carb: 43.3, fibra: 33.5 },
  "pinhão, cozido": { kcal: 174, prot: 3.0, lip: 0.7, carb: 43.9, fibra: 15.6 },
  "pupunha, cozida": { kcal: 219, prot: 2.5, lip: 12.8, carb: 29.6, fibra: 4.3 },
  "noz, crua": { kcal: 620, prot: 14.0, lip: 59.4, carb: 18.4, fibra: 7.2 },
};

function calcularMacros(nome, pesoG) {
  const n = nome.toLowerCase().trim();
  let encontrado = null;
  if (TACO[n]) encontrado = TACO[n];
  if (!encontrado) {
    for (const [alimento, vals] of Object.entries(TACO)) {
      if (n.includes(alimento) || alimento.includes(n)) {
        encontrado = vals; break;
      }
    }
  }
  if (!encontrado) return null;
  const fator = pesoG / 100;
  return {
    kcal:  Math.round(encontrado.kcal  * fator),
    prot:  Math.round(encontrado.prot  * fator * 10) / 10,
    lip:   Math.round(encontrado.lip   * fator * 10) / 10,
    carb:  Math.round(encontrado.carb  * fator * 10) / 10,
    fibra: Math.round(encontrado.fibra * fator * 10) / 10,
  };
}

const SYSTEM_PROMPT = `Você é nutricionista brasileiro especialista na Tabela TACO 4ª edição UNICAMP.

Analise a foto com MÁXIMA ATENÇÃO visual. Diferencie:
- ABACATE: casca verde/escura rugosa, oval, polpa verde/amarela cremosa — NUNCA confunda com pera
- PERA: casca lisa amarela/verde brilhante, formato sino, polpa branca crocante
- CENOURA: laranja, cilíndrica e comprida
- ABÓBORA: laranja, pedaços irregulares com casca grossa
- QUIABO: verde escuro, octogonal pontiagudo
- PIMENTÃO: verde/vermelho brilhante, largo, oco
- BOLO DE QUEIJO: amarelado, denso, pequeno, típico mineiro
- BOLO DE TRIGO: mais claro, esponjoso, mais alto

Use os nomes EXATOS da tabela TACO. Indique confiança 0-100 para cada alimento.

Responda SOMENTE JSON válido sem markdown:
{
  "refeicao": "nome da refeição",
  "alimentos": [
    {
      "nome": "nome exato TACO em português",
      "peso_estimado_g": número,
      "calorias": número baseado TACO,
      "porcao": "descrição da porção",
      "confianca": número 0-100,
      "alternativa": "outro alimento possível se confiança < 80 ou null"
    }
  ],
  "total_calorias": número,
  "observacao": "comentário nutricional breve",
  "precisao_geral": número 0-100
}`;

async function analisarComIA(base64Data) {
  const response = await fetch("/api/analisar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64: base64Data, prompt: SYSTEM_PROMPT }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `Erro ${response.status}`);
  }
  const data = await response.json();
  const text = data.content.map(b => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function salvarRefeicao(pacienteId, fotoFile, analise) {
  const nomeArq = `${pacienteId}/${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage
    .from("fotos-refeicoes")
    .upload(nomeArq, fotoFile, { contentType: "image/jpeg", upsert: true });
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage.from("fotos-refeicoes").getPublicUrl(nomeArq);
  const { data: ref, error: refErr } = await supabase
    .from("refeicoes")
    .insert({ paciente_id: pacienteId, nome: analise.refeicao, foto_url: urlData.publicUrl, total_kcal: analise.total_calorias })
    .select().single();
  if (refErr) throw refErr;
  if (analise.alimentos?.length > 0) {
    await supabase.from("alimentos").insert(
      analise.alimentos.map(a => ({ refeicao_id: ref.id, nome: a.nome, peso_g: a.peso_estimado_g, calorias: a.calorias, porcao: a.porcao }))
    );
  }
  return ref;
}

function LoadingEtapas({ etapa }) {
  const etapas = [
    { icon: "📤", texto: "Enviando foto para análise..." },
    { icon: "🤖", texto: "IA identificando alimentos..." },
    { icon: "📊", texto: "Calculando nutrientes pela TACO..." },
    { icon: "✅", texto: "Quase pronto..." },
  ];
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>
        {etapas[etapa]?.icon || "🔄"}
      </div>
      <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 15, marginBottom: 16 }}>{etapas[etapa]?.texto}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {etapas.map((_, i) => (
          <div key={i} style={{ width: i <= etapa ? 24 : 8, height: 8, borderRadius: 99, background: i <= etapa ? "#1E5C3A" : "#E0E0E0", transition: "all 0.4s ease" }} />
        ))}
      </div>
    </div>
  );
}

function ConfBadge({ v, alt }) {
  const cor = v >= 90 ? "#0F6E56" : v >= 70 ? "#633806" : "#791F1F";
  const bg  = v >= 90 ? "#EEF7F2" : v >= 70 ? "#FAEEDA" : "#FCEBEB";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <div style={{ background: bg, color: cor, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
        {v >= 90 ? "✓" : v >= 70 ? "~" : "?"} {v}%
      </div>
      {alt && <div style={{ fontSize: 10, color: "#aaa" }}>ou: {alt}</div>}
    </div>
  );
}

export default function NutriScan({ paciente }) {
  const PACIENTE_ID = paciente?.id || "00000000-0000-0000-0000-000000000001";
  const meta = paciente?.meta_kcal || 1850;

  const [imagem, setImagem]             = useState(null);
  const [base64, setBase64]             = useState(null);
  const [fotoFile, setFotoFile]         = useState(null);
  const [status, setStatus]             = useState("idle");
  const [etapaLoading, setEtapaLoading] = useState(0);
  const [resultado, setResultado]       = useState(null);
  const [alimentos, setAlimentos]       = useState([]);
  const [erro, setErro]                 = useState("");
  const [enviado, setEnviado]           = useState(false);
  const [mostrarAviso, setMostrarAviso] = useState(true);
  const fileRef = useRef();
  const timerRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => setMostrarAviso(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const iniciarLoading = () => {
    setEtapaLoading(0);
    timerRef.current = setInterval(() => {
      setEtapaLoading(prev => prev < 3 ? prev + 1 : 3);
    }, 2500);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleArquivo = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagem(e.target.result);
      setBase64(e.target.result.split(",")[1]);
      setStatus("idle"); setResultado(null);
      setEnviado(false); setErro(""); setAlimentos([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const analisar = async () => {
    if (!base64) return;
    setStatus("analisando"); setErro(""); setResultado(null);
    iniciarLoading();
    try {
      const analise = await analisarComIA(base64);
      clearInterval(timerRef.current);
      setResultado(analise);
      setAlimentos(analise.alimentos.map(a => {
        const macros = calcularMacros(a.nome, a.peso_estimado_g);
        return { ...a, editandoNome: false, taco_atualizado: false, macros };
      }));
      setStatus("confirmando");
    } catch (e) {
      clearInterval(timerRef.current);
      setErro(e.message); setStatus("erro");
    }
  };

  const atualizarNome = (idx, novoNome) => {
    setAlimentos(prev => prev.map((a, i) => {
      if (i !== idx) return a;
      const macros = calcularMacros(novoNome, a.peso_estimado_g);
      return { ...a, nome: novoNome, editandoNome: false, calorias: macros ? macros.kcal : a.calorias, taco_atualizado: !!macros, macros };
    }));
  };

  const atualizarCalorias = (idx, val) => {
    setAlimentos(prev => prev.map((a, i) => i === idx ? { ...a, calorias: Number(val) } : a));
  };

  const remover = (idx) => setAlimentos(prev => prev.filter((_, i) => i !== idx));

  const confirmarEEnviar = async () => {
    if (!resultado || !fotoFile) return;
    setStatus("salvando");
    const totalFinal = alimentos.reduce((s, a) => s + (Number(a.calorias) || 0), 0);
    try {
      await salvarRefeicao(PACIENTE_ID, fotoFile, { ...resultado, alimentos, total_calorias: totalFinal });
      setEnviado(true); setStatus("salvo");
    } catch (e) {
      setErro("Erro ao salvar: " + e.message); setStatus("erro");
    }
  };

  const reset = () => {
    setImagem(null); setBase64(null); setFotoFile(null);
    setResultado(null); setStatus("idle"); setEnviado(false);
    setErro(""); setAlimentos([]);
  };

  const totalConfirmado = alimentos.reduce((s, a) => s + (Number(a.calorias) || 0), 0);
  const totalProt  = alimentos.reduce((s, a) => s + (a.macros?.prot  || 0), 0);
  const totalCarb  = alimentos.reduce((s, a) => s + (a.macros?.carb  || 0), 0);
  const totalLip   = alimentos.reduce((s, a) => s + (a.macros?.lip   || 0), 0);
  const totalFibra = alimentos.reduce((s, a) => s + (a.macros?.fibra || 0), 0);
  const pct = Math.min(100, Math.round((totalConfirmado / meta) * 100));
  const precisao = resultado?.precisao_geral || 0;
  const emojis = ["🍚","🫘","🥦","🍗","🥕","🍳","🐟","🥗","🧀","🍞","🥩","🍅","🥑","🍌","🍊","🍎","🥭","🍇","🫐","🥝"];

  return (
    <div style={{ minHeight: "calc(100vh - 52px)", background: "#F7F5F0", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        @keyframes fadeOut { from { opacity:1 } to { opacity:0 } }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1E5C3A", padding: "20px 16px 24px", color: "white" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Bom dia! 👋 {paciente?.nome?.split(" ")[0] || ""}</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Meu prato de hoje</div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Registrado</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{totalConfirmado} <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>kcal</span></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Meta</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{meta} <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>kcal</span></div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, background: "#7DFCA8", height: "100%", borderRadius: 99, transition: "width 0.8s" }} />
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 5 }}>{pct}% da meta</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* Aviso nutricional — some após 4 segundos */}
        {mostrarAviso && (
          <div style={{ background: "#1E5C3A", color: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start", animation: "fadeUp 0.4s ease" }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚕️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>ATENÇÃO</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                É fundamental o acompanhamento de um nutricionista. Em breve terá lista de Nutricionistas cadastradas no NutriScan!
              </div>
            </div>
          </div>
        )}

        {status !== "confirmando" && !enviado && (
          <>
            <div
              onClick={() => !imagem && fileRef.current.click()}
              onDrop={e => { e.preventDefault(); handleArquivo(e.dataTransfer.files[0]); }}
              onDragOver={e => e.preventDefault()}
              style={{ border: imagem ? "none" : "2px dashed #C8E6D4", borderRadius: 20, overflow: "hidden", background: imagem ? "transparent" : "white", minHeight: imagem ? "auto" : 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: imagem ? "default" : "pointer", marginBottom: 12 }}
            >
              {imagem ? (
                <img src={imagem} alt="prato" style={{ width: "100%", borderRadius: 20, maxHeight: 280, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                  <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 16, marginBottom: 4 }}>Fotografar meu prato</div>
                  <div style={{ fontSize: 13, color: "#aaa" }}>Toque aqui para abrir a câmera</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleArquivo(e.target.files[0])} />
            </div>
            {imagem && status !== "analisando" && status !== "salvando" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={reset} style={{ flex: 1, background: "white", border: "1px solid #E8E8E0", borderRadius: 12, padding: 12, fontSize: 13, color: "#666", cursor: "pointer" }}>🔄 Trocar</button>
                <button onClick={analisar} style={{ flex: 2, background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>🔍 Analisar com IA</button>
              </div>
            )}
            {!imagem && (
              <button onClick={() => fileRef.current.click()} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                📷 Fotografar meu prato
              </button>
            )}
          </>
        )}

        {(status === "analisando" || status === "salvando") && (
          <LoadingEtapas etapa={status === "salvando" ? 3 : etapaLoading} />
        )}

        {status === "erro" && (
          <div style={{ background: "#FFF0F0", border: "1px solid #FFD0D0", borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#C00", marginBottom: 4 }}>⚠️ Erro</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{erro}</div>
            <button onClick={analisar} style={{ background: "#1E5C3A", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Tentar novamente</button>
          </div>
        )}

        {status === "confirmando" && resultado && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {imagem && <img src={imagem} alt="prato" style={{ width: "100%", borderRadius: 16, maxHeight: 200, objectFit: "cover", marginBottom: 12 }} />}

            <div style={{ background: precisao >= 85 ? "#EEF7F2" : precisao >= 70 ? "#FAEEDA" : "#FCEBEB", border: `1px solid ${precisao >= 85 ? "#C8E6D4" : precisao >= 70 ? "#F0D9A0" : "#FFD0D0"}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 22 }}>{precisao >= 85 ? "🎯" : precisao >= 70 ? "⚠️" : "❓"}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: precisao >= 85 ? "#0F6E56" : precisao >= 70 ? "#633806" : "#791F1F" }}>Precisão da análise: {precisao}%</div>
                <div style={{ fontSize: 11, color: "#888" }}>{precisao >= 85 ? "Boa precisão — confirme e envie!" : "Verifique os itens antes de enviar"}</div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              ✏️ Confirme — toque no nome para editar
            </div>

            {alimentos.map((a, i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "11px 14px", marginBottom: 8, border: `1px solid ${a.confianca < 70 ? "#FFD0D0" : a.confianca < 85 ? "#F0D9A0" : "#F0EFE8"}`, animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, background: "#EEF7F2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {emojis[i % emojis.length]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {a.editandoNome ? (
                      <input defaultValue={a.nome} autoFocus onBlur={e => atualizarNome(i, e.target.value)} onKeyDown={e => e.key === "Enter" && atualizarNome(i, e.target.value)}
                        style={{ width: "100%", border: "1.5px solid #1E5C3A", borderRadius: 6, padding: "4px 8px", fontSize: 13, fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
                    ) : (
                      <div onClick={() => setAlimentos(prev => prev.map((x, xi) => xi === i ? { ...x, editandoNome: true } : x))} style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", cursor: "text", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        {a.nome} <span style={{ fontSize: 11, color: "#1E5C3A" }}>✏️</span>
                        {a.taco_atualizado && <span style={{ fontSize: 10, color: "#0F6E56", background: "#EEF7F2", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>TACO ✓</span>}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#aaa" }}>{a.porcao} · {a.peso_estimado_g}g</span>
                      <input type="number" value={a.calorias} onChange={e => atualizarCalorias(i, e.target.value)}
                        style={{ width: 58, border: "1px solid #E8E8E0", borderRadius: 6, padding: "2px 6px", fontSize: 12, outline: "none", color: "#1E5C3A", fontWeight: 700 }} />
                      <span style={{ fontSize: 11, color: "#aaa" }}>kcal</span>
                    </div>
                    {a.macros && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {[["💪", a.macros.prot, "#378ADD"], ["🍞", a.macros.carb, "#EF9F27"], ["🥑", a.macros.lip, "#E24B4A"], ["🌾", a.macros.fibra, "#4CAF82"]].map(([icon, val, color], j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", gap: 3, background: "#F7F5F0", borderRadius: 6, padding: "2px 6px" }}>
                            <span style={{ fontSize: 10 }}>{icon}</span>
                            <span style={{ fontSize: 10, color, fontWeight: 700 }}>{val}g</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <ConfBadge v={a.confianca} alt={a.alternativa} />
                    <button onClick={() => remover(i)} style={{ background: "#FCEBEB", color: "#E24B4A", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✕</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Resumo macros */}
            {alimentos.some(a => a.macros) && (
              <div style={{ background: "white", borderRadius: 14, padding: "12px 16px", marginBottom: 12, border: "1px solid #F0EFE8" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📊 Macronutrientes</div>
                {[
                  { label: "💪 Proteínas", val: Math.round(totalProt * 10) / 10, color: "#378ADD" },
                  { label: "🍞 Carboidratos", val: Math.round(totalCarb * 10) / 10, color: "#EF9F27" },
                  { label: "🥑 Gorduras", val: Math.round(totalLip * 10) / 10, color: "#E24B4A" },
                  { label: "🌾 Fibras", val: Math.round(totalFibra * 10) / 10, color: "#4CAF82" },
                ].map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: i < 3 ? "1px solid #F7F5F0" : "none" }}>
                    <span style={{ color: "#666" }}>{m.label}</span>
                    <span style={{ color: m.color, fontWeight: 700 }}>{m.val}g</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: "#1E5C3A", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, color: "white" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Total confirmado</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{totalConfirmado} <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>kcal</span></div>
            </div>

            {resultado.observacao && (
              <div style={{ background: "#EEF7F2", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 8, marginBottom: 12 }}>
                <span>💡</span>
                <div style={{ fontSize: 13, color: "#1E5C3A", lineHeight: 1.5 }}>{resultado.observacao}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={reset} style={{ flex: 1, background: "white", border: "1px solid #E8E8E0", borderRadius: 12, padding: 12, fontSize: 13, color: "#666", cursor: "pointer" }}>🔄 Nova foto</button>
              <button onClick={confirmarEEnviar} style={{ flex: 2, background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✅ Confirmar e enviar</button>
            </div>
          </div>
        )}

        {enviado && (
          <div style={{ background: "#EEF7F2", border: "1px solid #C8E6D4", borderRadius: 14, padding: 20, textAlign: "center", animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 16 }}>Refeição confirmada e enviada!</div>
            <div style={{ fontSize: 12, color: "#4CAF82", marginTop: 4 }}>A nutricionista já pode ver sua refeição</div>
            <button onClick={reset} style={{ marginTop: 14, background: "transparent", border: "1px solid #C8E6D4", borderRadius: 8, padding: "8px 20px", fontSize: 13, color: "#1E5C3A", cursor: "pointer", fontWeight: 600 }}>
              Registrar outra refeição
            </button>
          </div>
        )}
      </div>
      <Rodape />
    </div>
  );
}
