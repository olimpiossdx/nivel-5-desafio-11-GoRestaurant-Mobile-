import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState<Food>({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;
  const { id } = routeParams;

  useEffect(() => {
    async function loadFavorite(): Promise<void> {
      await api.get<Food[]>(`favorites`).then(response => {
        response.data.filter(favorite => {
          if (favorite.id === id) {
            setIsFavorite(true);
          }
        });
      });
    }

    async function loadFood(): Promise<void> {
      const responseFood = await api.get<Food>(`foods/${id}`);
      const formatedExtras = responseFood.data.extras.map(extra => {
        extra.quantity = 0;
        return extra;
      });
      responseFood.data.formattedPrice = formatValue(responseFood.data.price);
      setFood(responseFood.data);
      setExtras(formatedExtras);
    }

    if (routeParams.id) {
      loadFood();
      loadFavorite();
    }
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    setExtras(extras => {
      return extras.map(extra => {
        if (extra.id === id) {
          extra.quantity += 1;
        }
        return extra;
      });
    })
    // Increment extra quantity
  }

  function handleDecrementExtra(id: number): void {
    setExtras(extras => {
      return extras.map(extra => {
        if (extra.id === id && extra.quantity >= 1) {
          extra.quantity -= 1;
        }
        return extra;
      });
    })
    // Decrement extra quantity
  }

  function handleIncrementFood(): void {
    setFoodQuantity(foodQuantity => foodQuantity += 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(foodQuantity => {
      if (foodQuantity > 1) {
        foodQuantity -= 1
      }
      return foodQuantity;
    });
  }

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      api.delete(`favorites/${food.id}`).then(response => {
        setIsFavorite(!isFavorite);
      });
    } else {
      setFood(state => {
        const { extras, formattedPrice, ...favoriteFood } = state;
        api.post('favorites', favoriteFood).then(response => {
          setIsFavorite(!isFavorite);
        });
        return state;
      });
    }
  }, [isFavorite]);

  const cartTotal = useMemo(() => {
    let totalAmount = food.price * foodQuantity;
    if (food.extras) {
      totalAmount += food.extras.reduce((soma, extra) => soma += extra.value * extra.quantity, 0);
    }
    return formatValue(totalAmount);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const { formattedPrice, id, ...order } = food;
    api.post('orders', order).then(response => {
      console.log('response.data', response.data);
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(() => (isFavorite ? 'favorite' : 'favorite-border'), [isFavorite]);

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image style={{ width: 327, height: 183 }} source={{ uri: food.image_url }} />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
