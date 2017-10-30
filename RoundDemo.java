import java.math.BigDecimal;
import java.math.RoundingMode;

public class RoundDemo {

    public static void main(String[] args) {

        /**
         *  0.325 -> 0.33
         *  0.315 -> 0.32
         *  0.305 -> 0.31
         */
        BigDecimal b1 = new BigDecimal("0.325");
        BigDecimal b1r = b1.setScale(2, RoundingMode.HALF_UP);
        System.out.println("b1r = " + b1r); // 0.33

        BigDecimal b2 = new BigDecimal("0.315");
        BigDecimal b2r = b2.setScale(2, RoundingMode.HALF_UP);
        System.out.println("b2r = " + b2r); // 0.32

        BigDecimal b3 = new BigDecimal("0.305");
        BigDecimal b3r = b3.setScale(2, RoundingMode.HALF_UP);
        System.out.println("b3r = " + b3r); // 0.31

    }

}
